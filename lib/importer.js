const path = require('path')
const fs = require('fs')
const remote = require('@electron/remote')
const { html2markdown, extractMetaFromHtml, models } = require('inkdrop')
const escapeRegExp = require('lodash.escaperegexp')
const { extractImages } = require('inkdrop-import-utils')
const makeTemplate = require('@silvermine/undertemplate')

const { dialog } = remote
const { Note, File: IDFile } = models

module.exports = {
  openImportDialog,
  importHTMLFromMultipleFiles,
  importHTMLFromFile
}

function openImportDialog() {
  return dialog.showOpenDialog({
    title: 'Open HTML file',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }]
  })
}

async function importHTMLFromMultipleFiles(files, destBookId) {
  try {
    for (let i = 0; i < files.length; ++i) {
      await importHTMLFromFile(files[i], destBookId)
    }
  } catch (e) {
    inkdrop.notifications.addError('Failed to import the HTML file', {
      detail: e.stack,
      dismissable: true
    })
  }
}

async function importHTMLFromFile(fn, destBookId) {
  if (!destBookId) {
    throw new Error('Destination notebook ID is not specified.')
  }
  if (!destBookId.startsWith('book:')) {
    throw new Error('Invalid destination notebook ID specified: ' + destBookId)
  }
  const html = fs.readFileSync(fn, 'utf-8')

  const parser = new DOMParser()
  const htmlDoc = parser.parseFromString(html, 'text/xml')

  const { createdAt, updatedAt } = extractMetaFromHtml(html)
  const book = extractBookInfo(htmlDoc)
  const highlights = getHighlights(htmlDoc)
  const tags = await getTags(book)

  for (let highlight of highlights) {
    const noteContent = createNoteBody(book, highlight)
    const noteTitle = `${highlight.text.slice(0, 85)}...`

    await createNote(
      noteTitle,
      noteContent,
      tags,
      createdAt,
      updatedAt,
      destBookId
    )
  }
}

function clean(text) {
  var re = /\- |\>  /gm
  return text.replace(re, '').trim()
}

function getTextByClassName(htmlDoc, className) {
  const results = htmlDoc.getElementsByClassName(className)

  if (results.length > 0) {
    return clean(results[0].textContent)
  }

  return '-'
}

function extractBookInfo(htmlDoc) {
  const title = getTextByClassName(htmlDoc, 'bookTitle')
  const authors = getTextByClassName(htmlDoc, 'authors')
  const citation = getTextByClassName(htmlDoc, 'citation')

  return {
    title,
    authors,
    citation
  }
}

function getSectionHighlights(element) {
  var sectionHighlights = []

  const sectionHeading = element
  element = sectionHeading.nextElementSibling

  while (element && ['noteHeading', 'noteText'].includes(element.className)) {
    var noteHeading = element.textContent

    var subsectionIndex = noteHeading.indexOf(' - ')
    var locationIndex = noteHeading.lastIndexOf(' > ')

    // TODO: get the highlight color
    var noteSubsection = noteHeading.slice(subsectionIndex, locationIndex)
    var noteLocation = noteHeading.slice(locationIndex)
    var noteText = element.nextElementSibling

    sectionHighlights.push({
      section: clean(sectionHeading.textContent),
      subsection: clean(noteSubsection),
      location: clean(noteLocation),
      text: clean(noteText.textContent)
    })

    element = noteText.nextElementSibling
  }

  return sectionHighlights
}

function getHighlights(htmlDoc) {
  var highlights = []

  const sections = htmlDoc.getElementsByClassName('sectionHeading')

  for (let section of sections) {
    const sectionHighlights = getSectionHighlights(section)

    var highlights = highlights.concat(sectionHighlights)
  }

  return highlights
}

async function getOrCreateTag(tags, tagName) {
  const maxLengthTagName = tagName.slice(0, 62)

  const result = await tags.findWithName(maxLengthTagName)

  if (!result) {
    const newTagId = tags.createId()
    const newTag = {
      _id: newTagId,
      name: maxLengthTagName,
      color: 'default',
      count: 0,
      updatedAt: Date.now(),
      createdAt: Date.now()
    }
    await tags.put(newTag)

    return newTagId
  }

  return result._id
}

async function getTags(book) {
  const db = inkdrop.main.dataStore.getLocalDB()
  const tags = db.tags

  const bookTags = await Promise.all([
    getOrCreateTag(tags, 'kindle highlights'),
    getOrCreateTag(tags, book.title),
    getOrCreateTag(tags, book.authors)
  ])

  return bookTags
}

function getNoteBodyTemplate() {
  const noteBodyTemplate = inkdrop.config.get(
    'import-kindle-highlights.noteBodyTemplate'
  )

  const lines = noteBodyTemplate.split('\\n')
  var multiLineTemplate = ''

  for (line of lines) {
    multiLineTemplate = multiLineTemplate.concat(`
${line.replace('\\n', '')}`)
  }

  return multiLineTemplate
}

function createNoteBody(book, highlight) {
  const noteBodyTemplate = getNoteBodyTemplate()

  template = makeTemplate(noteBodyTemplate)

  const body = template({ book, highlight })

  return body
}

async function createNote(title, body, tags, createdAt, updatedAt, destBookId) {
  const note = new Note({
    title,
    body,
    tags,
    createdAt,
    updatedAt
  })
  note.bookId = destBookId
  await note.save()
}
