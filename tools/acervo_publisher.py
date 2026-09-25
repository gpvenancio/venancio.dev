#!/usr/bin/env python3
"""Publicador independente do Acervo de Fé.

Converte DOCX para HTML preservando a formatação do Word e publica diretamente
no GitHub através da API. O computador editorial não precisa de uma cópia
local do projeto nem de Git.
"""
from __future__ import annotations

import base64
import html
import json
import re
import sys
import threading
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from datetime import date, datetime, timezone
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH

try:
    import keyring
except ImportError:
    keyring = None


CONFIG_DIR = (
    Path.home() / "AppData" / "Roaming" / "Acervo Publisher"
    if sys.platform == "win32"
    else Path.home() / ".config" / "acervo-publisher"
)
CONFIG_FILE = CONFIG_DIR / "config.json"
KEYRING_SERVICE = "Acervo Publisher"

GITHUB_API = "https://api.github.com"
GITHUB_API_VERSION = "2026-03-10"

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


DEFAULT_OWNER = "gpvenancio"
DEFAULT_REPO = "venancio.dev"
DEFAULT_BRANCH = "main"


def load_config():
    defaults = {
        "owner": DEFAULT_OWNER,
        "repo": DEFAULT_REPO,
        "branch": DEFAULT_BRANCH,
        "client_id": "",
    }
    try:
        if CONFIG_FILE.exists():
            data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
            defaults.update({k: v for k, v in data.items() if k in defaults})
    except Exception:
        pass
    return defaults


def save_config(config):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(
        json.dumps(config, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def token_store_key(config):
    return f"{config['owner']}/{config['repo']}"


TOKEN_FALLBACK_FILE = CONFIG_DIR / "tokens.json"


def _token_payload(access_token, access_expires_at, refresh_token, refresh_expires_at):
    return {
        "access_token": access_token,
        "access_expires_at": access_expires_at,
        "refresh_token": refresh_token,
        "refresh_expires_at": refresh_expires_at,
    }


def _save_token_fallback(config, payload):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    data = {}
    try:
        if TOKEN_FALLBACK_FILE.exists():
            data = json.loads(TOKEN_FALLBACK_FILE.read_text(encoding="utf-8"))
    except Exception:
        data = {}
    data[token_store_key(config)] = payload
    TOKEN_FALLBACK_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    if sys.platform != "win32":
        try:
            TOKEN_FALLBACK_FILE.chmod(0o600)
        except OSError:
            pass


def _load_token_fallback(config):
    try:
        if not TOKEN_FALLBACK_FILE.exists():
            return None
        data = json.loads(TOKEN_FALLBACK_FILE.read_text(encoding="utf-8"))
        return data.get(token_store_key(config))
    except Exception:
        return None


def store_tokens(config, access_token, access_expires_at, refresh_token, refresh_expires_at):
    payload = _token_payload(
        access_token, access_expires_at, refresh_token, refresh_expires_at
    )
    stored_in_keyring = False
    if keyring is not None:
        try:
            keyring.set_password(
                KEYRING_SERVICE,
                token_store_key(config),
                json.dumps(payload),
            )
            stored_in_keyring = True
        except Exception:
            pass

    # Mantemos uma cópia local protegida como recurso de persistência, caso
    # o backend do keyring não esteja disponível ou não seja persistente.
    _save_token_fallback(config, payload)
    return stored_in_keyring


def load_tokens(config):
    if keyring is not None:
        try:
            value = keyring.get_password(
                KEYRING_SERVICE, token_store_key(config)
            )
            if value:
                tokens = json.loads(value)
                if tokens.get("refresh_token") or tokens.get("access_token"):
                    return tokens
        except Exception:
            pass
    return _load_token_fallback(config)


def clear_tokens(config):
    if keyring is not None:
        try:
            keyring.delete_password(KEYRING_SERVICE, token_store_key(config))
        except Exception:
            pass
    try:
        if TOKEN_FALLBACK_FILE.exists():
            data = json.loads(TOKEN_FALLBACK_FILE.read_text(encoding="utf-8"))
            data.pop(token_store_key(config), None)
            TOKEN_FALLBACK_FILE.write_text(
                json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            if sys.platform != "win32":
                TOKEN_FALLBACK_FILE.chmod(0o600)
    except Exception:
        pass


class GitHubClient:
    def __init__(self, config):
        self.config = config
        self.access_token = None
        self.access_expires_at = 0
        self.refresh_token = None
        self.refresh_expires_at = 0
        self._load_saved_tokens()

    def _load_saved_tokens(self):
        tokens = load_tokens(self.config)
        if not tokens:
            return
        self.access_token = tokens.get("access_token")
        self.access_expires_at = float(tokens.get("access_expires_at", 0))
        self.refresh_token = tokens.get("refresh_token")
        self.refresh_expires_at = float(tokens.get("refresh_expires_at", 0))

    def is_authenticated(self):
        return bool(self.refresh_token or self.access_token)

    def _request(self, method, url, data=None, token=None):
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
            "User-Agent": "Acervo-Publisher",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        encoded = None
        if data is not None:
            encoded = json.dumps(data, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"

        request = urllib.request.Request(
            url,
            data=encoded,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as error:
            raw = error.read().decode("utf-8", errors="replace")
            try:
                detail = json.loads(raw)
                message = detail.get("message", raw)
            except Exception:
                message = raw or str(error)
            raise RuntimeError(
                f"GitHub devolveu HTTP {error.code}: {message}"
            ) from error
        except urllib.error.URLError as error:
            raise RuntimeError(
                f"Não foi possível contactar o GitHub: {error.reason}"
            ) from error

    def _token_request(self, data):
        encoded = urllib.parse.urlencode(data).encode("utf-8")
        request = urllib.request.Request(
            "https://github.com/login/oauth/access_token",
            data=encoded,
            headers={
                "Accept": "application/json",
                "User-Agent": "Acervo-Publisher",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            raw = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Erro de autenticação do GitHub: {raw}") from error

    def _save_token_response(self, response):
        if "access_token" not in response:
            raise RuntimeError(
                response.get("error_description")
                or response.get("error")
                or "O GitHub não devolveu um token de acesso."
            )

        now = time.time()
        access_expires = now + int(response.get("expires_in", 28800)) - 60
        refresh = response.get("refresh_token") or self.refresh_token
        refresh_expires = now + int(
            response.get("refresh_token_expires_in", 15897600)
        ) - 60

        self.access_token = response["access_token"]
        self.access_expires_at = access_expires
        self.refresh_token = refresh
        self.refresh_expires_at = refresh_expires

        store_tokens(
            self.config,
            self.access_token,
            self.access_expires_at,
            self.refresh_token,
            self.refresh_expires_at,
        )

    def refresh(self):
        if not self.refresh_token:
            return False
        if self.refresh_expires_at and time.time() >= self.refresh_expires_at:
            return False

        response = self._token_request(
            {
                "client_id": self.config["client_id"],
                "grant_type": "refresh_token",
                "refresh_token": self.refresh_token,
            }
        )
        if response.get("error"):
            return False
        self._save_token_response(response)
        return True

    def ensure_token(self):
        if self.access_token and time.time() < self.access_expires_at:
            return self.access_token
        if self.refresh():
            return self.access_token
        raise RuntimeError("É necessário ligar o Publisher ao GitHub.")

    def authenticate_device(self, progress=None):
        client_id = self.config.get("client_id", "").strip()
        if not client_id:
            raise RuntimeError(
                "Ainda não foi configurado o Client ID da GitHub App."
            )

        encoded = urllib.parse.urlencode({"client_id": client_id}).encode("utf-8")
        request = urllib.request.Request(
            "https://github.com/login/device/code",
            data=encoded,
            headers={
                "Accept": "application/json",
                "User-Agent": "Acervo-Publisher",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                device = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            raw = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Erro ao iniciar autenticação: {raw}") from error

        if "device_code" not in device:
            raise RuntimeError(
                device.get("error_description")
                or device.get("error")
                or "O GitHub não devolveu um código de dispositivo."
            )

        user_code = device["user_code"]
        verification_uri = device.get(
            "verification_uri", "https://github.com/login/device"
        )
        expires_at = time.time() + int(device.get("expires_in", 900))
        interval = int(device.get("interval", 5))

        if progress:
            progress(user_code, verification_uri)
        webbrowser.open(verification_uri)

        while time.time() < expires_at:
            time.sleep(interval)
            response = self._token_request(
                {
                    "client_id": client_id,
                    "device_code": device["device_code"],
                    "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                }
            )

            if response.get("access_token"):
                self._save_token_response(response)
                return

            error = response.get("error")
            if error == "authorization_pending":
                continue
            if error == "slow_down":
                interval += 5
                continue
            if error == "expired_token":
                raise RuntimeError(
                    "O código de autenticação expirou. Inicia a ligação novamente."
                )
            if error == "access_denied":
                raise RuntimeError("A autorização foi cancelada no GitHub.")
            raise RuntimeError(
                response.get("error_description")
                or response.get("error")
                or "Falha na autenticação do GitHub."
            )

        raise RuntimeError("O código de autenticação expirou.")

    def authenticated_user(self):
        token = self.ensure_token()
        return self._request("GET", f"{GITHUB_API}/user", token=token)

    def repo(self):
        token = self.ensure_token()
        owner = urllib.parse.quote(self.config["owner"], safe="")
        repo = urllib.parse.quote(self.config["repo"], safe="")
        return self._request(
            "GET",
            f"{GITHUB_API}/repos/{owner}/{repo}",
            token=token,
        )

    def get_index(self):
        token = self.ensure_token()
        owner = urllib.parse.quote(self.config["owner"], safe="")
        repo = urllib.parse.quote(self.config["repo"], safe="")
        path = "acervo/content/index.json"
        data = self._request(
            "GET",
            f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
            f"?ref={urllib.parse.quote(self.config['branch'], safe='')}",
            token=token,
        )
        try:
            content = base64.b64decode(data["content"]).decode("utf-8")
            return json.loads(content)
        except Exception as error:
            raise RuntimeError(
                "Não foi possível ler o index.json do Acervo no GitHub."
            ) from error

    def publish(self, publication, body):
        token = self.ensure_token()
        owner = urllib.parse.quote(self.config["owner"], safe="")
        repo = urllib.parse.quote(self.config["repo"], safe="")
        branch = self.config["branch"]

        ref = self._request(
            "GET",
            f"{GITHUB_API}/repos/{owner}/{repo}/git/ref/heads/"
            f"{urllib.parse.quote(branch, safe='')}",
            token=token,
        )
        parent_sha = ref["object"]["sha"]

        commit = self._request(
            "GET",
            f"{GITHUB_API}/repos/{owner}/{repo}/git/commits/{parent_sha}",
            token=token,
        )
        base_tree = commit["tree"]["sha"]

        index_content = json.dumps(
            publication["all_data"],
            ensure_ascii=False,
            indent=2,
        ) + "\n"

        language = publication["language"]
        pub_id = publication["publication"]["id"]
        html_path = f"acervo/content/{pub_id}/{language}.html"
        index_path = "acervo/content/index.json"

        tree = self._request(
            "POST",
            f"{GITHUB_API}/repos/{owner}/{repo}/git/trees",
            {
                "base_tree": base_tree,
                "tree": [
                    {
                        "path": index_path,
                        "mode": "100644",
                        "type": "blob",
                        "content": index_content,
                    },
                    {
                        "path": html_path,
                        "mode": "100644",
                        "type": "blob",
                        "content": body + "\n",
                    },
                ],
            },
            token=token,
        )

        title = publication["publication"]["translations"][language]["title"]
        commit_result = self._request(
            "POST",
            f"{GITHUB_API}/repos/{owner}/{repo}/git/commits",
            {
                "message": f'Publish "{title}" [{language}]',
                "tree": tree["sha"],
                "parents": [parent_sha],
            },
            token=token,
        )

        try:
            self._request(
                "PATCH",
                f"{GITHUB_API}/repos/{owner}/{repo}/git/refs/heads/"
                f"{urllib.parse.quote(branch, safe='')}",
                {"sha": commit_result["sha"], "force": False},
                token=token,
            )
        except Exception as error:
            raise RuntimeError(
                "A publicação foi preparada no GitHub, mas a branch mudou "
                "antes de poder ser atualizada. Atualiza a lista e tenta novamente."
            ) from error

        return commit_result

    def delete_publication(self, publication):
        """Remove uma publicação e todos os ficheiros das suas traduções."""
        token = self.ensure_token()
        owner = urllib.parse.quote(self.config["owner"], safe="")
        repo = urllib.parse.quote(self.config["repo"], safe="")
        branch = self.config["branch"]

        ref = self._request(
            "GET",
            f"{GITHUB_API}/repos/{owner}/{repo}/git/ref/heads/"
            f"{urllib.parse.quote(branch, safe='')}",
            token=token,
        )
        parent_sha = ref["object"]["sha"]

        commit = self._request(
            "GET",
            f"{GITHUB_API}/repos/{owner}/{repo}/git/commits/{parent_sha}",
            token=token,
        )
        base_tree = commit["tree"]["sha"]

        # O GitHub devolve GitRPC::BadObjectState se tentarmos apagar
        # um ficheiro que não existe na árvore base. Como o index pode
        # conter uma referência antiga, consultamos a árvore recursiva
        # antes de construir a operação de eliminação.
        tree_data = self._request(
            "GET",
            f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{base_tree}",
            {"recursive": "1"},
            token=token,
        )
        existing_paths = {
            entry.get("path")
            for entry in tree_data.get("tree", [])
            if entry.get("type") == "blob"
        }

        current_data = self.get_index()
        remaining = [
            item
            for item in current_data
            if item.get("id") != publication.get("id")
        ]

        tree_entries = [
            {
                "path": "acervo/content/index.json",
                "mode": "100644",
                "type": "blob",
                "content": json.dumps(
                    remaining, ensure_ascii=False, indent=2
                ) + "\n",
            }
        ]

        for translation in publication.get("translations", {}).values():
            content_path = translation.get("content")
            if content_path and content_path in existing_paths:
                tree_entries.append(
                    {
                        "path": content_path,
                        "mode": "100644",
                        "type": "blob",
                        "sha": None,
                    }
                )

        tree = self._request(
            "POST",
            f"{GITHUB_API}/repos/{owner}/{repo}/git/trees",
            {
                "base_tree": base_tree,
                "tree": tree_entries,
            },
            token=token,
        )

        translations = publication.get("translations", {})
        title = next(
            (
                translation.get("title")
                for translation in translations.values()
                if translation.get("title")
            ),
            publication.get("slug", publication.get("id", "")),
        )
        commit_result = self._request(
            "POST",
            f"{GITHUB_API}/repos/{owner}/{repo}/git/commits",
            {
                "message": f'Delete publication "{title}" [{publication.get("id", "")}]',
                "tree": tree["sha"],
                "parents": [parent_sha],
            },
            token=token,
        )

        try:
            self._request(
                "PATCH",
                f"{GITHUB_API}/repos/{owner}/{repo}/git/refs/heads/"
                f"{urllib.parse.quote(branch, safe='')}",
                {"sha": commit_result["sha"], "force": False},
                token=token,
            )
        except Exception as error:
            raise RuntimeError(
                "A eliminação foi preparada no GitHub, mas a branch mudou "
                "antes de poder ser atualizada. Atualiza a lista e verifica "
                "o estado da publicação antes de tentar novamente."
            ) from error

        return commit_result


def next_publication_id(data):
    year = date.today().year
    prefix = f"{year}-"
    numbers = []
    for publication in data:
        pub_id = str(publication.get("id", ""))
        if pub_id.startswith(prefix):
            try:
                numbers.append(int(pub_id[len(prefix):]))
            except ValueError:
                pass
    return f"{year}-{max(numbers, default=0) + 1:03d}"


def prepare_publication(data, meta, body, detected_synopsis):
    pub_id = meta["id"].strip()
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
                "slug": existing.get("slug") or slugify(meta["title"]),
            }
        )
    else:
        publication = {
            "id": pub_id,
            "type": meta["type"],
            "slug": slugify(meta["title"]),
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
    synopsis = meta.get("synopsis", "").strip() or detected_synopsis
    publication.setdefault("translations", {})[language] = {
        "title": meta["title"].strip(),
        "synopsis": synopsis,
        "content": f"{pub_id}/{language}.html",
    }

    data.sort(
        key=lambda item: item.get("updatedAt", ""),
        reverse=True,
    )

    return {
        "all_data": data,
        "publication": publication,
        "language": language,
    }


class SetupDialog(tk.Toplevel):
    def __init__(self, parent, config):
        super().__init__(parent)
        self.title("Configuração do GitHub")
        self.geometry("560x300")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()
        self.result = None

        frame = ttk.Frame(self, padding=20)
        frame.pack(fill="both", expand=True)

        ttk.Label(
            frame,
            text="LIGAÇÃO AO GITHUB",
            font=("TkDefaultFont", 11, "bold"),
        ).grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 16))

        fields = [
            ("Client ID da GitHub App", config.get("client_id", "")),
            ("Proprietário", config.get("owner", DEFAULT_OWNER)),
            ("Repositório", config.get("repo", DEFAULT_REPO)),
            ("Branch", config.get("branch", DEFAULT_BRANCH)),
        ]
        self.vars = {}
        for row, (label, value) in enumerate(fields, start=1):
            ttk.Label(frame, text=label).grid(
                row=row, column=0, sticky="w", pady=6
            )
            var = tk.StringVar(value=value)
            self.vars[label] = var
            ttk.Entry(frame, textvariable=var, width=42).grid(
                row=row, column=1, sticky="ew", pady=6
            )

        ttk.Label(
            frame,
            text=(
                "O Client ID não é uma palavra-passe. A autorização da conta "
                "é feita diretamente pelo GitHub através do fluxo de dispositivo."
            ),
            wraplength=500,
        ).grid(row=5, column=0, columnspan=2, sticky="w", pady=(12, 10))

        ttk.Button(
            frame,
            text="Guardar",
            command=self.save,
        ).grid(row=6, column=1, sticky="e", pady=10)

    def save(self):
        client_id = self.vars["Client ID da GitHub App"].get().strip()
        owner = self.vars["Proprietário"].get().strip()
        repo = self.vars["Repositório"].get().strip()
        branch = self.vars["Branch"].get().strip() or "main"

        if not client_id or not owner or not repo:
            messagebox.showwarning(
                "Configuração incompleta",
                "Preenche o Client ID, o proprietário e o repositório.",
                parent=self,
            )
            return

        self.result = {
            "client_id": client_id,
            "owner": owner,
            "repo": repo,
            "branch": branch,
        }
        self.destroy()


class App(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Publicador do Acervo de Fé")
        self.geometry("860x680")
        self.resizable(False, False)

        self.config_data = load_config()
        self.github = GitHubClient(self.config_data)
        self.docx = None
        self.selected_publication = None
        self.publications = []
        self.vars = {}

        frame = ttk.Frame(self, padding=20)
        frame.pack(fill="both", expand=True)

        header = ttk.Frame(frame)
        header.grid(row=0, column=0, columnspan=2, sticky="ew")
        header.columnconfigure(0, weight=1)

        ttk.Label(
            header,
            text="PUBLICAÇÕES",
            font=("TkDefaultFont", 11, "bold"),
        ).grid(row=0, column=0, sticky="w")

        self.connection_label = ttk.Label(
            header,
            text="GitHub: não ligado",
        )
        self.connection_label.grid(row=0, column=1, sticky="e", padx=(10, 8))

        ttk.Button(
            header,
            text="Ligar ao GitHub",
            command=self.connect_github,
        ).grid(row=0, column=2, sticky="e")

        self.publication_var = tk.StringVar()
        self.publication_combo = ttk.Combobox(
            frame,
            textvariable=self.publication_var,
            state="readonly",
            width=80,
        )
        self.publication_combo.grid(
            row=1, column=0, columnspan=2, sticky="ew", pady=(8, 4)
        )
        self.publication_combo.bind(
            "<<ComboboxSelected>>",
            self.select_publication,
        )

        button_frame = ttk.Frame(frame)
        button_frame.grid(
            row=2, column=0, columnspan=2, sticky="w", pady=(0, 14)
        )

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
        ttk.Button(
            button_frame,
            text="Configuração",
            command=self.configure,
        ).pack(side="left")

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
                width=74,
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
            width=70,
        ).grid(row=7, column=1, sticky="ew", pady=6)

        ttk.Label(frame, text="Idioma").grid(
            row=8, column=0, sticky="w", pady=6
        )
        self.lang = tk.StringVar(value="pt")
        self.language_combo = ttk.Combobox(
            frame,
            textvariable=self.lang,
            values=["pt", "en"],
            state="readonly",
            width=70,
        )
        self.language_combo.grid(row=8, column=1, sticky="ew", pady=6)
        self.language_combo.bind(
            "<<ComboboxSelected>>",
            self.language_changed,
        )

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
            wraplength=740,
        ).grid(row=12, column=0, columnspan=2, sticky="w", pady=5)

        action_frame = ttk.Frame(frame)
        action_frame.grid(row=13, column=1, sticky="e", pady=20)

        self.delete_button = ttk.Button(
            action_frame,
            text="Apagar publicação",
            command=self.delete_selected_publication,
            state="disabled",
        )
        self.delete_button.pack(side="left", padx=(0, 8))

        self.publish_button = ttk.Button(
            action_frame,
            text="Publicar",
            command=self.do_publish,
        )
        self.publish_button.pack(side="left")

        self.set_connection_status()
        if self.github.is_authenticated():
            self.refresh_publications()

    def set_connection_status(self, username=None):
        if username:
            self.connection_label.config(text=f"GitHub: {username}")
        elif self.github.is_authenticated():
            self.connection_label.config(text="GitHub: sessão guardada")
        else:
            self.connection_label.config(text="GitHub: não ligado")

    def configure(self):
        dialog = SetupDialog(self, self.config_data)
        self.wait_window(dialog)
        if not dialog.result:
            return
        self.config_data = dialog.result
        save_config(self.config_data)
        self.github = GitHubClient(self.config_data)
        self.set_connection_status()
        messagebox.showinfo(
            "Configuração guardada",
            "A configuração do GitHub foi guardada.",
        )

    def connect_github(self):
        if not self.config_data.get("client_id"):
            dialog = SetupDialog(self, self.config_data)
            self.wait_window(dialog)
            if not dialog.result:
                return
            self.config_data = dialog.result
            save_config(self.config_data)
            self.github = GitHubClient(self.config_data)

        self.connection_label.config(text="GitHub: a ligar…")

        def worker():
            try:
                def progress(code, uri):
                    def show_authorization_dialog():
                        dialog = tk.Toplevel(self)
                        dialog.title("Autorizar no GitHub")
                        dialog.transient(self)
                        dialog.grab_set()
                        dialog.resizable(False, False)

                        frame = ttk.Frame(dialog, padding=20)
                        frame.pack(fill="both", expand=True)

                        ttk.Label(
                            frame,
                            text="Foi aberto o GitHub no navegador.",
                            wraplength=420,
                        ).pack(anchor="w")
                        ttk.Label(
                            frame,
                            text="Código de autorização:",
                            font=("TkDefaultFont", 10, "bold"),
                        ).pack(anchor="w", pady=(16, 6))

                        code_var = tk.StringVar(value=code)
                        code_entry = tk.Entry(
                            frame,
                            textvariable=code_var,
                            justify="center",
                            width=max(16, len(code) + 2),
                            state="readonly",
                            readonlybackground="white",
                            foreground="black",
                            insertbackground="black",
                            relief="solid",
                            borderwidth=1,
                        )
                        code_entry.pack(anchor="center", pady=(0, 10))

                        button_frame = ttk.Frame(frame)
                        button_frame.pack(fill="x", pady=(0, 12))

                        copied_label = ttk.Label(button_frame, text="")
                        copied_label.pack(side="left", padx=(8, 0))

                        def copy_code():
                            self.clipboard_clear()
                            self.clipboard_append(code)
                            self.update()
                            copied_label.config(text="Código copiado.")

                        ttk.Button(
                            button_frame,
                            text="Copiar código",
                            command=copy_code,
                        ).pack(side="left")

                        ttk.Label(
                            frame,
                            text=f"Se o navegador não abrir, usa: {uri}",
                            wraplength=420,
                        ).pack(anchor="w", pady=(4, 14))

                        ttk.Button(
                            frame,
                            text="OK",
                            command=dialog.destroy,
                        ).pack(anchor="e")

                        dialog.protocol("WM_DELETE_WINDOW", dialog.destroy)
                        dialog.update_idletasks()
                        width = dialog.winfo_reqwidth()
                        height = dialog.winfo_reqheight()
                        x = self.winfo_rootx() + (self.winfo_width() - width) // 2
                        y = self.winfo_rooty() + (self.winfo_height() - height) // 2
                        dialog.geometry(f"{width}x{height}+{max(0, x)}+{max(0, y)}")

                    self.after(0, show_authorization_dialog)

                self.github.authenticate_device(progress)
                user = self.github.authenticated_user()
                self.github.repo()
                self.after(
                    0,
                    lambda: self.on_connected(user.get("login", "")),
                )
            except Exception as error:
                self.after(
                    0,
                    lambda: self.on_connection_error(str(error)),
                )

        threading.Thread(target=worker, daemon=True).start()

    def on_connected(self, username):
        self.set_connection_status(username)
        self.refresh_publications()
        messagebox.showinfo(
            "GitHub ligado",
            f"Conta GitHub ligada: {username}",
            parent=self,
        )

    def on_connection_error(self, error):
        self.set_connection_status()
        messagebox.showerror(
            "Erro de ligação",
            error,
            parent=self,
        )

    def publication_display(self, publication):
        translations = publication.get("translations", {})
        languages = ", ".join(
            lang.upper() for lang in sorted(translations)
        ) or "sem conteúdo"
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
        if not self.github.is_authenticated():
            return
        try:
            data = self.github.get_index()
            self.publications = data
            self.publication_combo["values"] = [
                self.publication_display(publication) for publication in data
            ]
            if self.selected_publication:
                selected_id = self.selected_publication.get("id")
                for index, publication in enumerate(data):
                    if publication.get("id") == selected_id:
                        self.publication_combo.current(index)
                        self.selected_publication = publication
                        break
        except Exception as error:
            messagebox.showerror(
                "Erro ao carregar publicações",
                str(error),
                parent=self,
            )

    def update_delete_button(self):
        self.delete_button.config(
            state="normal" if self.selected_publication else "disabled"
        )

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
        self.publish_button.config(text="Publicar")
        self.update_delete_button()

    def new_publication(self):
        self.clear_form()

    def load_selected_translation(self):
        if not self.selected_publication:
            return

        translations = self.selected_publication.get("translations", {})
        language = self.lang.get()
        translation = translations.get(language)

        if translation:
            self.vars["Título"].set(translation.get("title", ""))
            self.vars["Sinopse"].set(translation.get("synopsis", ""))
            self.publish_button.config(text="Atualizar publicação")
        else:
            self.vars["Título"].set("")
            self.vars["Sinopse"].set("")
            self.publish_button.config(text="Adicionar tradução")

        self.vars["Autor"].set(
            self.selected_publication.get("author", {}).get(
                "name", "Gonçalo Venâncio"
            )
        )

    def select_publication(self, _event=None):
        index = self.publication_combo.current()
        if index < 0 or index >= len(self.publications):
            return

        self.selected_publication = self.publications[index]
        self.docx = None
        self.filelabel.config(text="Nenhum documento escolhido")

        type_code = self.selected_publication.get("type", "sermon")
        self.type.set(
            next(
                (
                    label
                    for label, code in TYPES.items()
                    if code == type_code
                ),
                "Pregação",
            )
        )

        translations = self.selected_publication.get("translations", {})
        if self.lang.get() not in translations:
            self.lang.set(next(iter(translations), "pt"))
        self.load_selected_translation()
        self.update_delete_button()

    def language_changed(self, _event=None):
        if self.selected_publication:
            self.docx = None
            self.filelabel.config(text="Nenhum documento escolhido")
            self.load_selected_translation()

    def delete_selected_publication(self):
        if not self.selected_publication:
            return

        publication = self.selected_publication
        translations = publication.get("translations", {})
        title = next(
            (
                translation.get("title")
                for translation in translations.values()
                if translation.get("title")
            ),
            publication.get("slug", publication.get("id", "")),
        )
        languages = ", ".join(
            lang.upper() for lang in sorted(translations)
        ) or "sem traduções"

        confirmed = messagebox.askyesno(
            "Confirmar eliminação",
            f"Queres mesmo apagar a publicação?\n\n"
            f"{title}\n"
            f"ID interno: {publication.get('id', '')}\n"
            f"Traduções: {languages}\n\n"
            "Esta ação é permanente e remove a publicação do GitHub.",
            icon="warning",
            parent=self,
        )
        if not confirmed:
            return

        try:
            self.delete_button.config(state="disabled")
            self.publish_button.config(state="disabled")
            self.update_idletasks()

            self.github.delete_publication(publication)

            self.clear_form()
            self.refresh_publications()
            messagebox.showinfo(
                "Publicação apagada",
                f"{title} foi apagada com sucesso.",
                parent=self,
            )
        except Exception as error:
            self.update_delete_button()
            self.publish_button.config(state="normal")
            messagebox.showerror(
                "Erro ao apagar",
                str(error),
                parent=self,
            )

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
            messagebox.showerror("Erro", str(error), parent=self)

    def do_publish(self):
        if not self.github.is_authenticated():
            messagebox.showwarning(
                "GitHub não ligado",
                "Liga primeiro o Publisher ao GitHub.",
                parent=self,
            )
            return

        if not self.docx:
            messagebox.showwarning(
                "Falta o Word",
                "Escolhe primeiro o documento Word.",
                parent=self,
            )
            return

        try:
            self.publish_button.config(state="disabled")
            self.update_idletasks()

            data = self.github.get_index()
            if self.selected_publication:
                pub_id = self.selected_publication["id"]
            else:
                pub_id = next_publication_id(data)

            title, detected_synopsis, body = convert_docx(self.docx)
            meta = {
                "id": pub_id,
                "title": self.vars["Título"].get().strip() or title,
                "author": self.vars["Autor"].get().strip()
                or "Gonçalo Venâncio",
                "synopsis": self.vars["Sinopse"].get().strip()
                or detected_synopsis,
                "type": TYPES[self.type.get()],
                "language": self.lang.get(),
            }

            prepared = prepare_publication(
                data,
                meta,
                body,
                detected_synopsis,
            )
            self.github.publish(prepared, body)

            self.selected_publication = prepared["publication"]
            self.publications = prepared["all_data"]
            self.publication_combo["values"] = [
                self.publication_display(item)
                for item in self.publications
            ]

            for index, item in enumerate(self.publications):
                if item.get("id") == pub_id:
                    self.publication_combo.current(index)
                    break

            self.filelabel.config(text=self.docx.name)
            messagebox.showinfo(
                "Publicado",
                f"{meta['title']} foi publicado/atualizado com sucesso.\n\n"
                f"Idioma: {meta['language'].upper()}\n"
                f"ID interno: {pub_id}",
                parent=self,
            )
        except Exception as error:
            messagebox.showerror(
                "Erro ao publicar",
                str(error),
                parent=self,
            )
        finally:
            self.publish_button.config(state="normal")


if __name__ == "__main__":
    App().mainloop()
