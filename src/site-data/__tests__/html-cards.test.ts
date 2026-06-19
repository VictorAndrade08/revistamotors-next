import { describe, it, expect } from "vitest";
import { formatFecha, findCards, fillCard, replaceCards, type Card } from "../html-cards";

const art: Card = {
  titulo: "McLaren W1: 1.275 CV",
  slug: "mclaren-w1",
  fecha: "2026-06-19T14:00:00Z",
  portada: "https://cdn/x.webp",
};

describe("formatFecha", () => {
  it("formatea ISO-UTC a texto en español", () => {
    expect(formatFecha("2026-06-19T14:00:00Z")).toBe("19 de junio de 2026");
  });
  it("devuelve cadena vacía con null o fecha inválida", () => {
    expect(formatFecha(null)).toBe("");
    expect(formatFecha("no-es-fecha")).toBe("");
  });
});

describe("findCards", () => {
  it("localiza un bloque p-wrap balanceado con su clase", () => {
    const html = 'x<div class="p-wrap p-overlay-1"><div>hijo</div></div>y';
    const cards = findCards(html);
    expect(cards).toHaveLength(1);
    expect(cards[0].cls).toBe("p-wrap p-overlay-1");
    // el rango debe cubrir exactamente el bloque
    expect(html.slice(cards[0].start, cards[0].end)).toBe(
      '<div class="p-wrap p-overlay-1"><div>hijo</div></div>',
    );
  });

  it("encuentra varios bloques y respeta el anidamiento", () => {
    const html =
      '<div class="p-wrap a"><div><div>hondo</div></div></div>' +
      'sep<div class="p-wrap b">simple</div>';
    const cards = findCards(html);
    expect(cards.map((c) => c.cls)).toEqual(["p-wrap a", "p-wrap b"]);
  });

  it("ENDURECIDO: ignora un bloque sin cierre en vez de devolver un rango inválido", () => {
    const html = '<div class="p-wrap rota"><div>sin cerrar del todo</div>';
    expect(findCards(html)).toHaveLength(0);
  });

  it("no encuentra nada si no hay tarjetas", () => {
    expect(findCards("<p>hola</p>")).toHaveLength(0);
  });
});

describe("fillCard", () => {
  it("sustituye href, título, imagen y fecha; escapa el HTML", () => {
    const seg =
      '<a class="p-flink" href="/viejo/" title="Viejo"></a>' +
      '<img class="featured-img" src="/old.jpg" srcset="/old-2x.jpg 2x">' +
      "<time>1 de enero</time>";
    const out = fillCard(seg, { ...art, titulo: 'A & <b>"' });
    expect(out).toContain('href="/mclaren-w1/"');
    expect(out).toContain('title="A &amp; &lt;b&gt;&quot;"');
    expect(out).toContain('src="https://cdn/x.webp"');
    expect(out).not.toContain("srcset"); // se elimina el srcset viejo
    expect(out).toContain("<time>19 de junio de 2026</time>");
  });

  it("es defensivo: si no hay patrones que sustituir, no rompe el fragmento", () => {
    expect(fillCard("<span>nada que tocar</span>", art)).toBe("<span>nada que tocar</span>");
  });
});

describe("replaceCards", () => {
  it("rellena solo las tarjetas de la clase pedida, en orden", () => {
    const body =
      '<div class="p-wrap p-list-inline"><a class="p-url" href="/x/">Uno</a></div>' +
      '<div class="p-wrap p-list-inline"><a class="p-url" href="/y/">Dos</a></div>' +
      '<div class="p-wrap otra"><a class="p-url" href="/z/">No tocar</a></div>';
    const arts: Card[] = [
      { ...art, slug: "a", titulo: "Alfa" },
      { ...art, slug: "b", titulo: "Beta" },
    ];
    const out = replaceCards(body, "p-list-inline", arts);
    expect(out).toContain('href="/a/"');
    expect(out).toContain(">Alfa<");
    expect(out).toContain('href="/b/"');
    expect(out).toContain(">Beta<");
    expect(out).toContain('href="/z/"'); // la otra clase intacta
    expect(out).toContain(">No tocar<");
  });

  it("no falla si hay más tarjetas que noticias", () => {
    const body =
      '<div class="p-wrap p-list-inline"><a class="p-url" href="/x/">Uno</a></div>' +
      '<div class="p-wrap p-list-inline"><a class="p-url" href="/y/">Dos</a></div>';
    const out = replaceCards(body, "p-list-inline", [{ ...art, slug: "a", titulo: "Alfa" }]);
    expect(out).toContain('href="/a/"');
    expect(out).toContain('href="/y/"'); // la segunda se queda como estaba
  });
});
