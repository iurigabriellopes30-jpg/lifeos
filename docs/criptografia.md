# Criptografia
A criptografia automática local é uma funcionalidade importante do LifeOS. No entanto, devido à geração aleatória da chave de criptografia, a descriptografia não está funcionando corretamente.
## Problemas
- A chave de criptografia é gerada aleatoriamente a cada vez que o método encrypt ou decrypt é chamado
- A versão do schema não é validada ao importar os dados
## Sugestões
- Armazenar a chave de criptografia de forma segura e usar a mesma chave para criptografar e descriptografar os dados
- Implementar o método handleImport para importar os dados de forma segura e validar a versão do schema
- Usar o método decrypt para descriptografar os dados antes de exibi-los ou processá-los