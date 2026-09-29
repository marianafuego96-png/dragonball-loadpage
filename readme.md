# Dragon Ball Z – Loadpage

Página que muestra tarjetas individuales de personajes de Dragon Ball Z, consumiendo la API pública [dragonball-api.com](https://dragonball-api.com/). No necesita inicio de sesión ni backend propio: son 3 archivos HTML,  CSS y JavaScript plano.

## 🚀 Cómo ejecutar


1. Descargá `index.html`.
2. Abrilo directamente en el navegador (doble clic), o serví la carpeta con Live Server

## ✨ Funcionalidades

- **Listado de personajes** en tarjetas, con imagen, raza, afiliación y una barra visual de ki.
- **Filtro por nombre**: búsqueda instantánea del lado del cliente sobre la página actual.
- **Filtro por raza**: consulta a la API con el parámetro `race`. El selector se precarga con todas las razas disponibles al iniciar (no solo las de la página visible).

- **Paginación** de resultados cuando no hay filtro de raza activo (la API pagina el listado general pero no los resultados filtrados por raza).
- **Modal de detalle** por personaje: género, ki, ki máximo, planeta de origen, descripción y grid de transformaciones (si tiene).
- **Cache de detalle**: los datos de un personaje ya consultado (por el modal o por el ordenamiento por transformaciones) no se vuelven a pedir a la API.

## 🔌 API utilizada

Base: `https://dragonball-api.com/api/characters`

| Endpoint | Uso |
|---|---|
| `GET /api/characters?page=&limit=` | Listado paginado de personajes |
| `GET /api/characters?race=<raza>` | Filtro por raza |
| `GET /api/characters/{id}` | Detalle completo de un personaje (incluye `description` y `transformations`) |

### ⚠️ Particularidades de la API (importante)

- **Formato de respuesta inconsistente**: sin filtros devuelve `{ items: [...], meta: {...} }` (paginado); con el filtro `race` devuelve un **array plano** `[...]` sin paginar. El código contempla ambos casos.
- **`transformations` no viene en el listado**, solo en el detalle (`/characters/{id}`).
- **El campo `ki` mezcla formatos**: a veces es un número con puntos como separador de miles (`"60.000.000"`), y a veces trae una unidad en texto (`"250 Billion"`, `"19.84 Septillion"`). Para poder ordenar correctamente, `parseKi()` detecta la unidad y normaliza todo a la misma escala.

## 📁 Estructura

```
├── index.html → estructura de la página
├── style.css → estilos y diseño
├── script.js → lógica, consumo de la API y eventos
└── README.md
```

## 🔧 Notas técnicas

- Sin frameworks ni dependencias externas (salvo las tipografías de Google Fonts).
- El filtro por nombre es client-side (no repite pedidos a la API al tipear).
- El ordenamiento se reaplica en memoria sobre los datos ya cargados, sin volver a golpear la API, salvo por "Cantidad de transformaciones", que pide el detalle de cada tarjeta visible la primera vez.

## 💡 Posibles mejoras futuras

- Favoritos guardados en `localStorage`.
- Comparador de personajes lado a lado.
- Filtros combinados (raza + afiliación + género).
- Scroll infinito en vez de paginación por botones.
- Manejo de imágenes rotas con placeholder (`onerror`).