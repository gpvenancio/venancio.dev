#!/usr/bin/env python3
"""Publicador do Acervo de Fé.

Converte DOCX para HTML limpo preservando a formatação editorial e a
formatação direta do Word. A primeira página do documento, usada para
título e sinopse, não é publicada.
"""
from __future__ import annotations

import html
import json
import re
import unicodedata
from datetime import date
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH


ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "acervo" / "content"
INDEX = CONTENT / "index.json"

TYPES = {
    "Pregação": "sermon",
    "Mensagem": "message",
    "Artigo": "article",
    "Reflexão": "reflection",
    "Testemunho": "testimony",
    "Estudo bíblico": "bible-study",
    "Devocional": "devotional",
}

# Estes são os estilos editoriais definidos no Word para o Acervo.
EDITORIAL_STYLES = {
    "Normal Apresentação": ("p", "word-normal-apresentacao"),
    "Destaque Pregação": ("div", "word-destaque-pregacao"),
    "Referência Bíblica": ("p", "word-referencia-biblica"),
    "Passagem Bíblica": ("div", "word-passagem-biblica"),
    "Destaque 2": ("div", "word-destaque-2"),
}


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFD", value).encode("ascii", "ignore").decode()
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def color_hex(font):
    try:
        if font.color and font.color.type and font.color.rgb:
            return str(font.color.rgb)
    except Exception:
        pass
    return None


def effective_run(run, paragraph):
    """Obtém a formatação do run, com fallback para o estilo do parágrafo."""
    style_font = paragraph.style.font if paragraph.style else None
    font = run.font

    return {
        "name": font.name or (style_font.name if style_font else None),
        "size": font.size.pt if font.size else (
            style_font.size.pt if style_font and style_font.size else None
        ),
        "bold": font.bold if font.bold is not None else (
            style_font.bold if style_font else None
        ),
        "italic": font.italic if font.italic is not None else (
            style_font.italic if style_font else None
        ),
        "underline": font.underline if font.underline is not None else (
            style_font.underline if style_font else None
        ),
        "strike": font.strike if font.strike is not None else (
            style_font.strike if style_font else None
        ),
        "color": color_hex(font) or (
            color_hex(style_font) if style_font else None
        ),
    }


def paragraph_alignment(paragraph):
    alignment = paragraph.alignment

    if alignment is not None:
        return alignment

    style = paragraph.style
    if not style or style._element.pPr is None:
        return None

    jc = style._element.pPr.jc
    if jc is None:
        return None

    return {
        "center": WD_ALIGN_PARAGRAPH.CENTER,
        "both": WD_ALIGN_PARAGRAPH.JUSTIFY,
        "right": WD_ALIGN_PARAGRAPH.RIGHT,
        "left": WD_ALIGN_PARAGRAPH.LEFT,
    }.get(jc.val)


def paragraph_css(paragraph):
    """Preserva as propriedades de parágrafo relevantes para a publicação."""
    pf = paragraph.paragraph_format
    style_pf = paragraph.style.paragraph_format if paragraph.style else None

    before = pf.space_before if pf.space_before is not None else (
        style_pf.space_before if style_pf else None
    )
    after = pf.space_after if pf.space_after is not None else (
        style_pf.space_after if style_pf else None
    )
    line = pf.line_spacing if pf.line_spacing is not None else (
        style_pf.line_spacing if style_pf else None
    )
    left = pf.left_indent if pf.left_indent is not None else (
        style_pf.left_indent if style_pf else None
    )
    right = pf.right_indent if pf.right_indent is not None else (
        style_pf.right_indent if style_pf else None
    )
    first = pf.first_line_indent if pf.first_line_indent is not None else (
        style_pf.first_line_indent if style_pf else None
    )

    css = []

    alignment = paragraph_alignment(paragraph)
    alignments = {
        WD_ALIGN_PARAGRAPH.CENTER: "center",
        WD_ALIGN_PARAGRAPH.JUSTIFY: "justify",
        WD_ALIGN_PARAGRAPH.RIGHT: "right",
        WD_ALIGN_PARAGRAPH.LEFT: "left",
    }
    if alignment in alignments:
        css.append(f"text-align:{alignments[alignment]}")

    if before is not None:
        css.append(f"margin-top:{before.pt:g}pt")
    if after is not None:
        css.append(f"margin-bottom:{after.pt:g}pt")

    if isinstance(line, float):
        css.append(f"line-height:{line:g}")
    elif line is not None:
        # Word sometimes stores line spacing as a Length.
        try:
            css.append(f"line-height:{line.pt:g}pt")
        except Exception:
            pass

    if left is not None:
        css.append(f"padding-left:{left.pt:g}pt")
    if right is not None:
        css.append(f"padding-right:{right.pt:g}pt")
    if first is not None:
        css.append(f"text-indent:{first.pt:g}pt")

    return ";".join(css)




def paragraph_border_css(paragraph):
    """Converte bordas de parágrafo definidas diretamente no Word para CSS."""
    ppr = paragraph._p.pPr
    if ppr is None:
        return ""
    pborder = ppr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pBdr')
    if pborder is None:
        return ""

    css = []
    sides = {
        'top': 'top', 'bottom': 'bottom', 'left': 'left', 'right': 'right',
    }
    ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
    for word_side, css_side in sides.items():
        node = pborder.find(ns + word_side)
        if node is None:
            continue
        val = node.get(ns + 'val')
        if val in (None, 'nil', 'none'):
            continue
        size = node.get(ns + 'sz')
        color = node.get(ns + 'color')
        width = (float(size) / 8.0) if size else 0.75
        style = 'solid' if val in ('single', 'thick', 'double') else 'solid'
        if val == 'double':
            style = 'double'
        colour = f'#{color}' if color and color.lower() != 'auto' else 'currentColor'
        css.append(f'border-{css_side}:{width:g}pt {style} {colour}')
        space = node.get(ns + 'space')
        if word_side == 'bottom' and space:
            try:
                css.append(f'padding-bottom:{float(space):g}pt')
            except ValueError:
                pass
        elif word_side == 'top' and space:
            try:
                css.append(f'padding-top:{float(space):g}pt')
            except ValueError:
                pass
    return ';'.join(css)

def style_css(paragraph):
    """Reproduz os cinco estilos editoriais definidos no Word."""
    name = paragraph.style.name if paragraph.style else "Normal"

    if name == "Destaque Pregação":
        return (
            "background:#EDF2F4;"
            "border-left:3pt solid #1F3B4D;"
            "padding-left:10pt;"
            "padding-right:0;"
        )

    if name == "Passagem Bíblica":
        return (
            "background:#F2F0E9;"
            "border-left:3pt solid #8A6D1D;"
            "padding-left:9.9pt;"
            "padding-right:9.9pt;"
        )

    if name == "Destaque 2":
        return (
            "background:#EDF2F4;"
            "border-top:.75pt solid #1F3B4D;"
            "border-bottom:.75pt solid #1F3B4D;"
            "padding-top:1.25pt;"
            "padding-bottom:1.25pt;"
        )

    return ""


def paragraph_font_css(paragraph):
    font = paragraph.style.font if paragraph.style else None
    if not font:
        return ""

    css = []
    if font.name:
        css.append(f"font-family:{html.escape(font.name, quote=True)}")
    if font.size:
        css.append(f"font-size:{font.size.pt:g}pt")
    color = color_hex(font)
    if color:
        css.append(f"color:#{color}")
    if font.bold:
        css.append("font-weight:700")
    if font.italic:
        css.append("font-style:italic")

    return ";".join(css)


def run_html(run, paragraph):
    if not run.text:
        return ""

    fmt = effective_run(run, paragraph)
    css = []

    if fmt["name"]:
        css.append(f"font-family:{html.escape(fmt['name'], quote=True)}")
    if fmt["size"]:
        css.append(f"font-size:{fmt['size']:g}pt")
    if fmt["color"]:
        css.append(f"color:#{fmt['color']}")
    if fmt["bold"]:
        css.append("font-weight:700")
    if fmt["italic"]:
        css.append("font-style:italic")

    decorations = []
    if fmt["underline"]:
        decorations.append("underline")
    if fmt["strike"]:
        decorations.append("line-through")
    if decorations:
        css.append(f"text-decoration:{' '.join(decorations)}")

    text = html.escape(run.text, quote=False)
    text = text.replace("\n", "<br>").replace("\t", "&emsp;")

    if css:
        return f'<span style="{";".join(css)}">{text}</span>'

    return text


def looks_like_large_heading(paragraph):
    """Preserva títulos que usam o estilo Normal mas formatação direta."""
    if not paragraph.text.strip():
        return False

    sizes = []
    bold = False

    for run in paragraph.runs:
        fmt = effective_run(run, paragraph)
        if fmt["size"]:
            sizes.append(fmt["size"])
        bold = bold or bool(fmt["bold"])

    return bold and max(sizes or [0]) >= 24


def paragraph_has_page_break_before(paragraph):
    return bool(paragraph._p.xpath('.//w:pageBreakBefore'))


def empty_paragraph_height(paragraph):
    """Cria uma altura de linha para parágrafos vazios, como no Word."""
    style = paragraph.style
    font_size = None
    if style and style.font and style.font.size:
        font_size = style.font.size.pt

    if not font_size:
        font_size = 11.0

    line = paragraph.paragraph_format.line_spacing
    if line is None and style:
        line = style.paragraph_format.line_spacing

    if isinstance(line, float):
        line_height = font_size * line
    elif line is not None:
        try:
            line_height = line.pt
        except Exception:
            line_height = font_size * 1.15
    else:
        line_height = font_size * 1.15

    return line_height



def paragraph_numbering(paragraph):
    """Retorna (numId, ilvl) da numeração do Word, quando existir."""
    ppr = paragraph._p.pPr
    if ppr is None or ppr.numPr is None:
        return None
    num_id = ppr.numPr.numId
    ilvl = ppr.numPr.ilvl
    if num_id is None:
        return None
    return str(num_id.val), int(ilvl.val) if ilvl is not None else 0


def numbered_list_format(doc, num_id, ilvl):
    """Obtém a forma de numeração definida pelo Word."""
    ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    numbering = doc.part.numbering_part.element
    num_node = next(
        (node for node in numbering.findall(f"{{{ns}}}num")
         if node.get(f"{{{ns}}}numId") == str(num_id)),
        None,
    )
    if num_node is None:
        return "decimal", "."
    abstract_node = num_node.find(f"{{{ns}}}abstractNumId")
    if abstract_node is None:
        return "decimal", "."
    abstract_id = abstract_node.get(f"{{{ns}}}val")
    abstract = next(
        (node for node in numbering.findall(f"{{{ns}}}abstractNum")
         if node.get(f"{{{ns}}}abstractNumId") == abstract_id),
        None,
    )
    if abstract is None:
        return "decimal", "."
    level = next(
        (node for node in abstract.findall(f"{{{ns}}}lvl")
         if node.get(f"{{{ns}}}ilvl") == str(ilvl)),
        None,
    )
    if level is None:
        return "decimal", "."
    fmt = level.find(f"{{{ns}}}numFmt")
    text = level.find(f"{{{ns}}}lvlText")
    return (
        fmt.get(f"{{{ns}}}val") if fmt is not None else "decimal",
        text.get(f"{{{ns}}}val") if text is not None else "%1.",
    )


def list_css_type(num_format):
    return {
        "decimal": "decimal",
        "lowerLetter": "lower-alpha",
        "upperLetter": "upper-alpha",
        "lowerRoman": "lower-roman",
        "upperRoman": "upper-roman",
        "bullet": "disc",
    }.get(num_format, "decimal")


def render_paragraph(paragraph, doc, page_break=False, suppress_style_box=False):
    """Renderiza um parágrafo mantendo a sua formatação Word."""
    text = paragraph.text.replace("\xa0", " ")
    style_name = paragraph.style.name if paragraph.style else "Normal"
    element, class_name = EDITORIAL_STYLES.get(style_name, ("p", "word-normal"))

    css_parts = [
        paragraph_css(paragraph),
        paragraph_font_css(paragraph),
        "" if suppress_style_box else style_css(paragraph),
        "" if suppress_style_box else paragraph_border_css(paragraph),
    ]
    if page_break:
        css_parts.append("margin-top:28pt")

    if not text.strip():
        css_parts.append(f"min-height:{empty_paragraph_height(paragraph):g}pt")
        css = ";".join(part for part in css_parts if part)
        style_attribute = f' style="{css}"' if css else ""
        return f'<p class="word-empty"{style_attribute} aria-hidden="true"></p>'

    content = "".join(run_html(run, paragraph) for run in paragraph.runs)
    if not content:
        content = html.escape(text, quote=False)

    if style_name == "Normal" and looks_like_large_heading(paragraph):
        element = "h2"
        class_name = "word-heading"

    css = ";".join(part for part in css_parts if part)
    style_attribute = f' style="{css}"' if css else ""
    return f'<{element} class="{class_name}"{style_attribute}>{content}</{element}>'

def convert_docx(path: Path):
    doc = Document(path)
    paragraphs = doc.paragraphs
    nonempty = [(i, p) for i, p in enumerate(paragraphs) if p.text.strip()]

    if len(nonempty) < 2:
        raise ValueError(
            "O documento precisa de ter a primeira página com título e sinopse."
        )

    title = nonempty[0][1].text.strip()
    synopsis = nonempty[1][1].text.strip()

    start = None
    for i, paragraph in enumerate(paragraphs):
        if i > nonempty[1][0] and paragraph_has_page_break_before(paragraph):
            start = i
            break
    if start is None:
        start = nonempty[1][0] + 1

    output = []
    i = start
    while i < len(paragraphs):
        paragraph = paragraphs[i]
        numbering = paragraph_numbering(paragraph)
        style_name = paragraph.style.name if paragraph.style else "Normal"

        # Listas do Word: preservar a numeração real em vez de depender do
        # texto visível do parágrafo, porque o número não faz parte de p.text.
        if numbering:
            num_id, ilvl = numbering
            num_format, _ = numbered_list_format(doc, num_id, ilvl)
            list_type = list_css_type(num_format)
            items = []
            j = i
            while j < len(paragraphs):
                p = paragraphs[j]
                n = paragraph_numbering(p)
                if n != (num_id, ilvl):
                    break
                item_html = render_paragraph(p, doc, paragraph_has_page_break_before(p), True)
                items.append(item_html)
                j += 1
            output.append(
                f'<ol class="word-list" style="list-style-type:{list_type}">'
                + "".join(f'<li>{item}</li>' for item in items)
                + "</ol>"
            )
            i = j
            continue

        # Blocos de destaque consecutivos devem permanecer como um único
        # componente visual. O Word aplica o estilo a cada parágrafo, mas no
        # Acervo queremos conservar a continuidade visual do destaque.
        if style_name in {"Destaque Pregação", "Passagem Bíblica", "Destaque 2"}:
            group_style = style_name
            group_class = {
                "Destaque Pregação": "word-destaque-pregacao-group",
                "Passagem Bíblica": "word-passagem-biblica-group",
                "Destaque 2": "word-destaque-2-group",
            }[group_style]
            children = []
            j = i
            while j < len(paragraphs):
                p = paragraphs[j]
                if (p.style.name if p.style else "Normal") != group_style:
                    break
                children.append(render_paragraph(p, doc, paragraph_has_page_break_before(p), True))
                j += 1
            group_css = {
                "Destaque Pregação": "background:#EDF2F4;border-left:3pt solid #1F3B4D;padding-left:10pt;padding-right:0",
                "Passagem Bíblica": "background:#F2F0E9;border-left:3pt solid #8A6D1D;padding-left:9.9pt;padding-right:9.9pt",
                "Destaque 2": "background:#EDF2F4;border-top:.75pt solid #1F3B4D;border-bottom:.75pt solid #1F3B4D;padding-top:1.25pt;padding-bottom:1.25pt",
            }[group_style]
            output.append(f'<div class="{group_class}" style="{group_css}">{"".join(children)}</div>')
            i = j
            continue

        output.append(render_paragraph(paragraph, doc, paragraph_has_page_break_before(paragraph)))
        i += 1

    return title, synopsis, "\n".join(output)

def load_index():
    if not INDEX.exists():
        return []
    return json.loads(INDEX.read_text(encoding="utf-8"))


def save_index(data):
    INDEX.parent.mkdir(parents=True, exist_ok=True)
    INDEX.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def publish(meta, docx_path):
    data = load_index()
    pub_id = meta["id"].strip()

    title, detected_synopsis, body = convert_docx(docx_path)

    if meta.get("title"):
        title = meta["title"].strip()

    synopsis = meta.get("synopsis", "").strip() or detected_synopsis
    today = date.today().isoformat()

    existing = next(
        (publication for publication in data if publication.get("id") == pub_id),
        None,
    )

    if existing:
        publication = existing
        publication.update(
            {
                "type": meta["type"],
                "author": {
                    "id": slugify(meta["author"]),
                    "name": meta["author"],
                },
                "status": "published",
                "updatedAt": today,
                "slug": existing.get("slug") or slugify(title),
            }
        )
    else:
        publication = {
            "id": pub_id,
            "type": meta["type"],
            "slug": slugify(title),
            "author": {
                "id": slugify(meta["author"]),
                "name": meta["author"],
            },
            "status": "published",
            "createdAt": today,
            "updatedAt": today,
            "series": None,
            "tags": [],
            "bibleReferences": [],
            "translations": {},
        }
        data.append(publication)

    language = meta["language"]
    folder = CONTENT / pub_id
    folder.mkdir(parents=True, exist_ok=True)

    filename = f"{language}.html"
    target = folder / filename
    target.write_text(body + "\n", encoding="utf-8")

    publication.setdefault("translations", {})[language] = {
        "title": title,
        "synopsis": synopsis,
        "content": f"{pub_id}/{filename}",
    }

    save_index(
        sorted(
            data,
            key=lambda publication: publication.get("updatedAt", ""),
            reverse=True,
        )
    )

    return publication, target


class App(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Publicador do Acervo de Fé")
        self.geometry("820x620")
        self.resizable(False, False)

        self.docx = None
        self.selected_publication = None
        self.vars = {}

        frame = ttk.Frame(self, padding=20)
        frame.pack(fill="both", expand=True)

        ttk.Label(
            frame,
            text="PUBLICAÇÕES",
            font=("TkDefaultFont", 11, "bold"),
        ).grid(row=0, column=0, columnspan=2, sticky="w")

        self.publication_var = tk.StringVar()
        self.publication_combo = ttk.Combobox(
            frame,
            textvariable=self.publication_var,
            state="readonly",
            width=76,
        )
        self.publication_combo.grid(
            row=1, column=0, columnspan=2, sticky="ew", pady=(8, 4)
        )
        self.publication_combo.bind("<<ComboboxSelected>>", self.select_publication)

        button_frame = ttk.Frame(frame)
        button_frame.grid(row=2, column=0, columnspan=2, sticky="w", pady=(0, 14))

        ttk.Button(
            button_frame,
            text="+ Nova publicação",
            command=self.new_publication,
        ).pack(side="left")
        ttk.Button(
            button_frame,
            text="Atualizar lista",
            command=self.refresh_publications,
        ).pack(side="left", padx=8)

        ttk.Separator(frame).grid(
            row=3, column=0, columnspan=2, sticky="ew", pady=(0, 16)
        )

        fields = [
            ("Título", ""),
            ("Autor", "Gonçalo Venâncio"),
            ("Sinopse", ""),
        ]

        for row, (label, value) in enumerate(fields, start=4):
            ttk.Label(frame, text=label).grid(
                row=row, column=0, sticky="w", pady=6
            )
            variable = tk.StringVar(value=value)
            self.vars[label] = variable
            ttk.Entry(
                frame,
                textvariable=variable,
                width=70,
            ).grid(row=row, column=1, sticky="ew", pady=6)

        ttk.Label(frame, text="Tipo").grid(
            row=7, column=0, sticky="w", pady=6
        )
        self.type = tk.StringVar(value="Pregação")
        ttk.Combobox(
            frame,
            textvariable=self.type,
            values=list(TYPES),
            state="readonly",
            width=66,
        ).grid(row=7, column=1, sticky="ew", pady=6)

        ttk.Label(frame, text="Idioma").grid(
            row=8, column=0, sticky="w", pady=6
        )
        self.lang = tk.StringVar(value="pt")
        ttk.Combobox(
            frame,
            textvariable=self.lang,
            values=["pt", "en"],
            state="readonly",
            width=66,
        ).grid(row=8, column=1, sticky="ew", pady=6)

        ttk.Button(
            frame,
            text="Escolher Word…",
            command=self.choose,
        ).grid(row=9, column=1, sticky="w", pady=12)

        self.filelabel = ttk.Label(
            frame,
            text="Nenhum documento escolhido",
        )
        self.filelabel.grid(row=10, column=1, sticky="w")

        ttk.Separator(frame).grid(
            row=11, column=0, columnspan=2, sticky="ew", pady=18
        )

        ttk.Label(
            frame,
            text=(
                "A primeira página do Word é usada apenas para título e "
                "sinopse e não é publicada. A formatação do documento, "
                "incluindo estilos, negritos, espaçamentos e parágrafos "
                "vazios, é preservada."
            ),
            wraplength=700,
        ).grid(row=12, column=0, columnspan=2, sticky="w", pady=5)

        self.publish_button = ttk.Button(
            frame,
            text="Publicar nova publicação",
            command=self.do_publish,
        )
        self.publish_button.grid(row=13, column=1, sticky="e", pady=20)

        self.refresh_publications()

    def publication_display(self, publication):
        translations = publication.get("translations", {})
        languages = ", ".join(sorted(translations)) or "sem conteúdo"
        updated = publication.get("updatedAt", "")
        title = next(
            (
                translation.get("title")
                for translation in translations.values()
                if translation.get("title")
            ),
            publication.get("slug", publication.get("id", "")),
        )
        return f"{title}  ·  {languages}  ·  Atualizado em {updated}"

    def refresh_publications(self):
        data = load_index()
        self.publications = data
        self.publication_combo["values"] = [
            self.publication_display(publication) for publication in data
        ]

        if self.selected_publication:
            selected_id = self.selected_publication.get("id")
            for index, publication in enumerate(data):
                if publication.get("id") == selected_id:
                    self.publication_combo.current(index)
                    break

    def clear_form(self):
        self.selected_publication = None
        self.docx = None
        self.publication_var.set("")
        self.publication_combo.set("")
        self.vars["Título"].set("")
        self.vars["Autor"].set("Gonçalo Venâncio")
        self.vars["Sinopse"].set("")
        self.type.set("Pregação")
        self.lang.set("pt")
        self.filelabel.config(text="Nenhum documento escolhido")
        self.publish_button.config(text="Publicar nova publicação")

    def new_publication(self):
        self.clear_form()

    def select_publication(self, _event=None):
        index = self.publication_combo.current()
        if index < 0 or index >= len(self.publications):
            return

        publication = self.publications[index]
        self.selected_publication = publication
        self.docx = None
        self.filelabel.config(text="Nenhum documento escolhido")

        translations = publication.get("translations", {})
        language = self.lang.get()
        if language not in translations:
            language = next(iter(translations), "pt")
        self.lang.set(language)

        translation = translations.get(language, {})
        self.vars["Título"].set(translation.get("title", ""))
        self.vars["Sinopse"].set(translation.get("synopsis", ""))
        self.vars["Autor"].set(publication.get("author", {}).get("name", "Gonçalo Venâncio"))

        type_code = publication.get("type", "sermon")
        self.type.set(next((label for label, code in TYPES.items() if code == type_code), "Pregação"))
        self.publish_button.config(text="Atualizar publicação")

    def choose(self):
        selected = filedialog.askopenfilename(
            filetypes=[("Word", "*.docx")]
        )

        if not selected:
            return

        self.docx = Path(selected)
        self.filelabel.config(text=self.docx.name)

        try:
            title, synopsis, _ = convert_docx(self.docx)
            self.vars["Título"].set(title)
            self.vars["Sinopse"].set(synopsis)
        except Exception as error:
            messagebox.showerror("Erro", str(error))

    def next_publication_id(self):
        year = date.today().year
        prefix = f"{year}-"
        numbers = []
        for publication in load_index():
            pub_id = str(publication.get("id", ""))
            if pub_id.startswith(prefix):
                try:
                    numbers.append(int(pub_id[len(prefix):]))
                except ValueError:
                    pass
        return f"{year}-{max(numbers, default=0) + 1:03d}"

    def do_publish(self):
        if not self.docx:
            messagebox.showwarning(
                "Falta o Word",
                "Escolhe primeiro o documento Word.",
            )
            return

        if self.selected_publication:
            pub_id = self.selected_publication["id"]
        else:
            pub_id = self.next_publication_id()

        meta = {
            "id": pub_id,
            "title": self.vars["Título"].get(),
            "author": self.vars["Autor"].get() or "Gonçalo Venâncio",
            "synopsis": self.vars["Sinopse"].get(),
            "type": TYPES[self.type.get()],
            "language": self.lang.get(),
        }

        try:
            publication, target = publish(meta, self.docx)
            self.selected_publication = publication
            self.refresh_publications()
            messagebox.showinfo(
                "Publicado",
                f"{publication.get('translations', {}).get(meta['language'], {}).get('title', meta['title'])}"
                f" foi publicado/atualizado com sucesso.\n\n"
                f"ID interno: {publication['id']}\n"
                f"Ficheiro: {target}",
            )
        except Exception as error:
            messagebox.showerror("Erro ao publicar", str(error))


if __name__ == "__main__":
    App().mainloop()
