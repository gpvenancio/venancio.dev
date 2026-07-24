# venancio.dev

Personal website for Gonçalo Venâncio.

Built with semantic HTML, CSS, and a small amount of JavaScript, with a focus on clarity, accessibility, responsive design, and a lightweight structure.

## Live site

https://venancio.dev

## Main areas

### Landing page

The homepage introduces Gonçalo Venâncio, links to the main areas of the website, and provides a direct contact address.

### Atlantico

Atlantico is a calm dark theme for Visual Studio Code and compatible editors, designed for focused development, long coding sessions, and visual comfort.

### Poesia do Venâncio

A Portuguese poetry website that loads published texts from Blogger and includes a dedicated book page.

### Development

An English development profile and project page. It is linked from the Atlantico page rather than from the main landing page.

## Preferences

The landing page, poetry pages, and book page support Portuguese and English. Language and theme preferences are stored locally in the visitor's browser. The development and Atlantico pages remain in English, and Atlantico remains permanently dark.

## Project structure

```text
.
├── index.html
├── style.css
├── script.js
├── assets/
│   └── atlantico/
├── atlantico/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── screenshots/
├── development/
│   └── index.html
├── poesia/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── livro/
│       ├── index.html
│       └── book.js
├── README.md
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```
