

# Diagnóstico Forense — Bug de Finalização do Onboarding

## Mapeamento Completo do Fluxo

### 1. Botão "Entrar no Portal MVP"
- **Componente**: `src/pages/Onboarding.tsx`, linha ~611
- **Função chamada**: `handleComplete()` (linha 311)

### 2. Cadeia de Execução de `handleComplete()`

```text
handleComplete()
  ├─ saveNucleusToSupabase(companyId, nucleoMembers)     → nucleus_members
  ├─ saveEmployeesToSupabase(companyId, finalPopulation)  → employees
  ├─ saveOnboardingProgress(companyId, {...})              → company_onboarding_progress
  └─ completeOnboarding()                                 → companies (AuthContext)
       └─ navigate("/")
```

### 3. Função `completeOnboarding()` — AuthContext.tsx (linha 227)

Executa:
```typescript
await supabase.from("companies")
  .update({
    onboarding_status: "concluido",
    onboarding_completed_at: new Date().toISOString(),  // ← PROBLEMA PROVÁVEL
  })
  .eq("id", user.companyId)
```

### 4. Lógica de Redirect — ProtectedRoute.tsx (linha 36)

```typescript
if (user.onboardingStatus !== 'completed' && user.role === "admin_empresa") {
  return <Navigate to="/onboarding" replace />;
}
```

---

## Diagnóstico: 3 Causas Raiz Identificadas

### CAUSA A — Coluna inexistente `onboarding_completed_at`

O `types/supabase.ts` define a tabela `companies` **sem** a coluna `onboarding_completed_at`. O UPDATE em `completeOnboarding()` envia essa coluna inexistente. Dependendo da configuração de RLS e schema validation do Supabase, isso pode:
- Causar erro silencioso que faz o `.single()` falhar
- Rejeitar o UPDATE inteiro por coluna desconhecida
- Resultado: o `onboarding_status` **nunca é atualizado** para "concluido"

### CAUSA B — Tabelas de onboarding podem não existir

`saveNucleusToSupabase`, `saveEmployeesToSupabase`, e `saveOnboardingProgress` usam tabelas (`nucleus_members`, `employees`, `company_onboarding_progress`) que foram definidas em `mvp_v2_tables.sql`. Se o SQL **nunca foi executado** no Supabase, essas operações falham silenciosamente e o `handleComplete()` lança exceção **antes** de chegar ao `completeOnboarding()`.

A cadeia de execução em `handleComplete()` é:
1. `saveNucleusToSupabase` → falha se tabela não existe → **throw** → catch → "Erro ao finalizar"
2. `completeOnboarding()` **nunca é alcançado**

### CAUSA C — Dupla busca no `buildUserFromSession` com mismatch

Após o UPDATE, `completeOnboarding` chama `buildUserFromSession` que faz DUAS buscas:
1. Busca direta na tabela `companies` → obtém `onboarding_status` raw ("concluido")
2. `fetchCompanyById` → converte via `mapOnboardingFromDB` para "completed"

O `statusMap` na linha 62 converte `"completed"` → `"completed"` ✓, mas a **segunda** chamada (`fetchCompanyById`) mapeia "concluido" → "completed" que entra no `statusMap` como key "completed" → "completed". Isso funciona em teoria, mas se a primeira chamada tiver falhado (causa A), o status lido será "nao_iniciado", que se mapeia para "nao_iniciado", e o `ProtectedRoute` compara com `!== 'completed'` → **redirect para /onboarding**.

---

## Resumo do Diagnóstico

| Pergunta | Resposta |
|----------|---------|
| A. Causa raiz do "Erro ao finalizar" | Tabelas `nucleus_members`/`employees`/`company_onboarding_progress` provavelmente não existem no Supabase, ou a coluna `onboarding_completed_at` causa rejeição do UPDATE |
| B. Coluna lida no portal | `onboarding_status` da tabela `companies` |
| C. Coluna escrita no final | `onboarding_status` + `onboarding_completed_at` (esta última possivelmente inexistente) |
| D. Mismatch de nomes | **Sim** — `onboarding_completed_at` não existe no schema definido |
| E. Mismatch de valores | **Não** — "concluido" é o valor correto para o DB e o mapeamento funciona |
| F. companyId incorreto/nulo | Possível se `profile.company_id` não foi setado na criação do usuário |
| G. Tipo do erro | Combinação de: **coluna inexistente** + **tabelas possivelmente não criadas** + **RLS bloqueando UPDATE** |

## Arquivos Envolvidos

| Arquivo | Papel |
|---------|-------|
| `src/pages/Onboarding.tsx` | Botão, handleComplete, advanceStep |
| `src/contexts/AuthContext.tsx` | completeOnboarding, buildUserFromSession, statusMap |
| `src/lib/employeeService.ts` | saveNucleus, saveEmployees, saveOnboardingProgress |
| `src/lib/companyService.ts` | fetchCompanyById, mapOnboardingFromDB |
| `src/components/auth/ProtectedRoute.tsx` | Gate de redirect para /onboarding |
| `src/types/supabase.ts` | Schema sem `onboarding_completed_at` |

## Próximos Passos Recomendados

Para confirmar definitivamente, é necessário:
1. Verificar no Supabase SQL Editor se as tabelas `nucleus_members`, `employees`, `company_onboarding_progress` **existem**
2. Verificar se a coluna `onboarding_completed_at` **existe** na tabela `companies`
3. Verificar as **RLS policies** da tabela `companies` para o role `admin_empresa` (UPDATE pode estar bloqueado)
4. Verificar se o `profile.company_id` do usuário de teste está corretamente setado

