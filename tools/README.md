# Publicador do Acervo

No Linux, a partir da raiz do projeto:

```bash
python3 tools/acervo_publisher.py
```

O publicador lê um `.docx`, usa os estilos editoriais do Acervo e preserva a formatação do documento, incluindo negritos, espaçamentos e parágrafos vazios. A primeira página é usada apenas para título e sinopse e não é publicada.

O ID da publicação é interno. Para uma publicação existente, escolhe-se a publicação na lista e o publicador atualiza automaticamente a publicação correta. Para uma publicação nova, o ID é criado automaticamente.
