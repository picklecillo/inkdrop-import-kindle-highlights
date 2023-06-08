const ImportHTMLSelectNotebookDialog = require('./select-book-dialog').default

const defaultNoteBody =
  '## Info\\n* **Title**: <%= book.title %>\\n* **Authors**: <%= book.authors %>\\n* **Citation**: <%= book.citation %>\\n\\n## Highlight\\n* **Section**: <%= highlight.section %>\\n* **Subsection**: <%= highlight.subsection %>\\n* **Location** <%= highlight.location %>\\n\\n> <%= highlight.text %>\\n'

const config = {
  noteBodyTemplate: {
    title: 'Note body template',
    description: '',
    type: 'string',
    default: defaultNoteBody
  }
}

module.exports = {
  activate() {
    inkdrop.components.registerClass(ImportHTMLSelectNotebookDialog)
    inkdrop.layouts.addComponentToLayout(
      'modal',
      'ImportHTMLSelectNotebookDialog'
    )
  },
  deactivate() {
    inkdrop.layouts.removeComponentFromLayout(
      'modal',
      'ImportHTMLSelectNotebookDialog'
    )
    inkdrop.components.deleteClass(ImportHTMLSelectNotebookDialog)
  },
  config
}
