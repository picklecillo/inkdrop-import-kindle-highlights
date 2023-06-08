# Import Kindle highlights plugin

This is a built-in plugin for Inkdrop.
This plugin allows you to import Kindle highlights (from HTML files)

Forked from the official [import HTML plugin](https://github.com/inkdropapp/inkdrop-import-html)


## Config Options

### Configure the new note body template (`noteBodyTemplate`)
Update the default template. Available to use: `book.title`, `book.authors`, `book.citation`, `highlight.section`, `highlight.subsection`, `highlight.location`, `highlight.text`.


## Note body template
* Using `@silvermine/undertemplate` to get around the `unsafe-eval` security restriction.

## Kindle export issue

The highlights export from the Kindle app for macOS v1.40.1 generates an html file with mismatching html tags.

```html
<h2 class='sectionHeading'>I. Before you Write: Mindset</h2>
<h3 class='noteHeading'>
Highlight (<span class='highlight_yellow'>yellow</span>) - 1.1 Why write a non-fiction book? &gt; Location 119</div>
<div class='noteText'>Why do you care about this subject so much that you want to invest the time, emotional energy, and maybe money, in order to write it?
</h3>
```

This is the export from the Android app, with correct tags:

```html
<div class="sectionHeading">I. Before you Write: Mindset</div>
<div class="noteHeading">
Highlight (<span class="highlight_yellow">yellow</span>) - 1.1 Why write a non-fiction book? >  Location 119
</div>
<div class="noteText">
Why do you care about this subject so much that you want to invest the time, emotional energy, and maybe money, in order to write it?
</div>
```

The macOS export can be fixed by replacing all `h2` and `h3` tags with `div`s.


## TO DO
* [x] Import highlights from HTML export
* [x] Configurable note template
* [ ] Configurable note title
* [ ] Get highlight color from `noteHeading`
* [ ] Option to export all notes to a single file?
    * A lot like a regular html to markdown import.
* [ ] Import from old `txt` exports?
