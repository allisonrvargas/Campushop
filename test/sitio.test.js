import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const paginas = readdirSync(raiz).filter((f) => f.endsWith('.html'));
const leer = (f) => readFileSync(join(raiz, f), 'utf8');

// Las 8 vistas que describe el README
const VISTAS = ['index.html', 'catalogo.html', 'producto.html', 'carrito.html', 'checkout.html', 'perfil.html', 'historial.html', 'vacio.html'];
const CSS = ['css/base.css', 'css/layout.css', 'css/components.css', 'css/responsive.css'];

test('existen las 8 vistas que describe el README', () => {
    for (const v of VISTAS) assert.ok(paginas.includes(v), `falta ${v}`);
});

test('el reto se cumple: ninguna página usa JavaScript', () => {
    for (const p of paginas) {
        const html = leer(p);
        assert.ok(!/<script/i.test(html), `${p} tiene una etiqueta <script>`);
        assert.ok(!/\son(click|load|submit|change|input)\s*=/i.test(html), `${p} tiene manejadores de eventos en línea`);
    }
});

for (const p of paginas) {
    test(`${p}: estructura base (doctype, idioma, codificación, viewport y título)`, () => {
        const html = leer(p);
        assert.match(html, /<!DOCTYPE html>/i);
        assert.match(html, /<html[^>]*lang=/i);
        assert.match(html, /<meta[^>]*charset=/i);
        assert.match(html, /<meta[^>]*name="viewport"/i, 'sin viewport: no sería mobile-first');
        assert.match(html, /<title>[^<]+<\/title>/i);
    });

    test(`${p}: carga los 4 archivos CSS y todos existen`, () => {
        const html = leer(p);
        for (const c of CSS) {
            assert.ok(html.includes(`href="${c}"`), `${p} no carga ${c}`);
            assert.ok(existsSync(join(raiz, c)), `${c} no existe`);
        }
    });

    test(`${p}: imágenes con texto alternativo y archivos locales existentes`, () => {
        const html = leer(p);
        for (const img of html.match(/<img\b[^>]*>/gi) ?? []) assert.match(img, /\balt="/i, `imagen sin alt: ${img.slice(0, 80)}`);
        const locales = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)].map((m) => m[1]).filter((r) => !/^(https?:|mailto:|tel:|data:|\/\/)/.test(r));
        for (const ruta of locales) assert.ok(existsSync(join(raiz, decodeURI(ruta))), `${p} enlaza a ${ruta}, que no existe`);
    });
}

test('la navegación principal del inicio lleva a páginas que existen', () => {
    const destinos = [...leer('index.html').matchAll(/<a[^>]*href="([a-z]+\.html)"/g)].map((m) => m[1]);
    assert.ok(destinos.length >= 3);
    for (const d of new Set(destinos)) assert.ok(paginas.includes(d), `la navegación apunta a ${d}`);
});