# Portal do Aluno – Pequeno Aprendiz

Sistema educacional institucional (HTML/CSS/JS + Node). Dados em `data/portal.json` e `data/chat.json` (demonstração, separados do código).

## Como iniciar

Copie `.env.example` se quiser alterar a porta (`PORT=8000`).

```bash
npm start
```

O servidor sobe em `http://localhost:8000`.

```bash
npm test
```

## Contas de demonstração

Login aceita **CPF, e-mail ou matrícula** + senha.

| Perfil | Identificador | Senha |
| --- | --- | --- |
| Admin | 999.999.999-99 / admin@pequenoaprendiz.edu / ADM-0001 | Admin@2026 |
| Aluno (Ana) | 123.456.789-01 / ana.martins@aluno.edu / 2023001547 | Aluno@2026 |
| Professor (Carlos) | 987.654.321-00 / carlos.eduardo@prof.edu / PRF-1044 | Prof@2026 |

## Recursos

- Autenticação com senha em hash (scrypt), sessão no servidor, bloqueio após 5 tentativas
- Login, recuperação e alteração de senha; perfil editável; papéis aluno / professor / admin
- Dashboard com média, frequência, pendências, próxima aula, avisos e atalhos
- Boletim, histórico, grade horária, frequência/faltas e situação (aprovado / recuperação / reprovado)
- Calendário diário, semanal e mensal (aulas, provas, feriados, férias, eventos da instituição)
- Atividades com envio de arquivo, prazos, notas e comentários do professor; questionários online
- AVA por disciplina e módulos; materiais (PDF, vídeo, documentos); busca e recentes
- Mural de avisos com filtro por categoria e data; marcar como lido
- Financeiro: mensalidades, boleto via provedor (sem cartão) e comprovante
- Secretaria: declarações, histórico, protocolos e download quando concluído
- Biblioteca: catálogo, busca, disponibilidade, empréstimos e devoluções
- Central de ajuda: FAQ, chamados e status
- Chat em tempo real (WebSocket, com fallback HTTP)
- Painel do professor: notas, frequência, diário, avisos
- Painel administrativo: contas, cursos, turmas, materiais, calendário, atividades, comunicados, relatórios e auditoria
