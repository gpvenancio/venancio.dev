# Acervo Publisher

O Publisher é uma aplicação independente para publicação do Acervo de Fé.

A versão atual converte documentos Word preservando a formatação e publica
diretamente no repositório GitHub configurado, sem exigir uma cópia local do
site ou Git no computador editorial.

A autenticação usa uma GitHub App através do Device Flow. As credenciais de
sessão são guardadas pelo sistema de credenciais do Windows através do pacote
`keyring`.
