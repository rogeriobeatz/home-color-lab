

# Integrar Replicate como provedor de IA externo

## Objetivo
Substituir o Lovable AI Gateway pelo Replicate para as duas operações de IA do projeto (analise de ambiente e aplicacao de cores), visando reducao de custos.

## Como funciona o Replicate

O Replicate e uma plataforma que hospeda modelos open-source de IA. Voce paga por segundo de execucao, e os modelos de visao/edicao de imagem costumam ser mais baratos que APIs proprietarias.

**Modelos recomendados para o seu caso:**
- **Analise de ambiente**: `meta/llama-4-maverick-instruct` (modelo multimodal que aceita imagens) ou manter Lovable AI para esta parte (ja e barata ~$0.001/chamada)
- **Edicao de imagem (aplicar cores)**: `stability-ai/stable-diffusion-img2img` ou `adirik/flux-dev` para edicao de imagem guiada por prompt -- e onde esta o maior custo hoje

## Etapas de implementacao

### 1. Configurar API Key do Replicate
- Voce precisara criar uma conta em [replicate.com](https://replicate.com) e gerar um API Token
- O token sera armazenado de forma segura como secret no backend (REPLICATE_API_KEY)

### 2. Atualizar Edge Function `apply-color`
- Trocar a chamada ao Lovable AI Gateway pela API do Replicate
- Usar um modelo de edicao de imagem (img2img) com o prompt existente
- A API do Replicate funciona de forma assincrona: voce cria uma "prediction" e depois consulta o resultado (polling)
- Manter toda a validacao, rate limiting e tratamento de erros existentes

### 3. Atualizar Edge Function `analyze-room` (opcional)
- A analise de ambiente ja e barata (~$0.001). Pode manter no Lovable AI Gateway
- Se quiser migrar tambem, usaria um modelo multimodal do Replicate

### 4. Adaptar resposta no frontend
- O formato de retorno muda ligeiramente (Replicate retorna URL da imagem gerada em vez de base64)
- O EditorView.tsx precisara de ajuste minimo para lidar com URLs externas

## Secao tecnica

### Fluxo da API do Replicate

```text
Cliente -> Edge Function -> Replicate API (POST /predictions)
                                |
                          (polling ate concluir)
                                |
                         URL da imagem gerada
                                |
Edge Function <- resultado <- Replicate
Cliente <- { success: true, image: "https://..." }
```

### Exemplo de chamada ao Replicate

```typescript
// Criar prediction
const response = await fetch("https://api.replicate.com/v1/predictions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${REPLICATE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "stability-ai/stable-diffusion-img2img",
    input: {
      image: imageUrl,
      prompt: "room with wall painted in blue color...",
      strength: 0.6,
    }
  })
});
// Depois fazer polling no campo "urls.get" ate status = "succeeded"
```

### Comparativo de custos estimados

| Operacao | Lovable AI (atual) | Replicate (estimado) |
|----------|-------------------|---------------------|
| Analise de ambiente | ~$0.001-0.003 | ~$0.001-0.005 |
| Aplicar cor (por imagem) | ~$0.02-0.04 | ~$0.005-0.015 |
| Sessao tipica (1+3) | ~$0.09-0.12 | ~$0.02-0.05 |

### Arquivos modificados

- `supabase/functions/apply-color/index.ts` -- trocar provider de IA
- `supabase/functions/analyze-room/index.ts` -- opcional, pode manter como esta
- `src/components/editor/EditorView.tsx` -- ajuste menor para lidar com URLs de imagem
- `supabase/config.toml` -- sem alteracoes necessarias

### Consideracoes

- **Latencia**: O Replicate pode ser mais lento (10-30s vs 5-15s do Gemini) por causa do cold start e polling
- **Qualidade**: Modelos open-source podem gerar resultados com qualidade diferente; sera necessario testar e ajustar prompts
- **Fallback**: Podemos manter o Lovable AI como fallback caso o Replicate falhe

