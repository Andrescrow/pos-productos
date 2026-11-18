import { useState, useEffect } from 'react';
import {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from './api';
import './App.css';

const INITIAL_FORM = {
  codigo: '',
  nombre: '',
  categoria: '',
  precio: '',
  stock: '',
};

// Mensajes de validación nativa del navegador traducidos al español.
// Sin esto, el navegador muestra sus textos en inglés
// (p. ej. "Value must be greater than or equal to 0.").
const MENSAJES_CAMPO = {
  precio: {
    rangeUnderflow: 'El precio debe ser mayor o igual a 0.01.',
    stepMismatch: 'El precio solo admite hasta 2 decimales.',
  },
  stock: {
    rangeUnderflow: 'El stock debe ser mayor o igual a 0.',
    stepMismatch: 'El stock debe ser un número entero.',
  },
};

function mensajeValidacion(input) {
  const v = input.validity;
  const propios = MENSAJES_CAMPO[input.name] || {};
  if (v.valueMissing) return 'Por favor completa este campo.';
  if (v.badInput) return 'Por favor ingresa un número válido.';
  if (v.rangeUnderflow) return propios.rangeUnderflow || `El valor debe ser mayor o igual a ${input.min}.`;
  if (v.rangeOverflow) return `El valor debe ser menor o igual a ${input.max}.`;
  if (v.stepMismatch) return propios.stepMismatch || 'Por favor ingresa un valor válido.';
  if (v.typeMismatch || v.patternMismatch) return 'El formato del valor no es válido.';
  return '';
}

function handleInvalid(e) {
  e.target.setCustomValidity(mensajeValidacion(e.target));
}

// Limpia los mensajes personalizados para que el navegador vuelva a evaluar los campos.
function limpiarValidacion(form) {
  if (!form) return;
  Array.from(form.elements).forEach((el) => el.setCustomValidity?.(''));
}

export default function App() {
  const [productos, setProductos] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // Carga inicial de productos
  useEffect(() => {
    cargarListaProductos();
  }, []);

  async function cargarListaProductos() {
    setCargando(true);
    setError(null);
    try {
      const data = await listarProductos();
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    e.target.setCustomValidity('');
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEditar(producto) {
    setError(null);
    setExito(null);
    setEditandoId(producto.id);
    setFormData({
      codigo: producto.codigo || '',
      nombre: producto.nombre || '',
      categoria: producto.categoria || '',
      precio: producto.precio ?? '',
      stock: producto.stock ?? '',
    });

    // Desplazar la vista al formulario suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelar() {
    setEditandoId(null);
    setFormData(INITIAL_FORM);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setExito(null);

    // Validación básica en cliente
    if (!formData.codigo.trim() || !formData.nombre.trim() || !formData.categoria.trim()) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    if (Number(formData.precio) <= 0) {
      setError('El precio debe ser un número mayor a 0.');
      return;
    }

    if (Number(formData.stock) < 0 || !Number.isInteger(Number(formData.stock))) {
      setError('El stock debe ser un número entero mayor o igual a 0.');
      return;
    }

    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarProducto(editandoId, formData);
        setExito(`Producto "${formData.nombre}" actualizado con éxito.`);
      } else {
        await crearProducto(formData);
        setExito(`Producto "${formData.nombre}" creado con éxito.`);
      }

      setFormData(INITIAL_FORM);
      setEditandoId(null);
      await cargarListaProductos();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al procesar el producto.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(producto) {
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas eliminar el producto "${producto.nombre}" (Código: ${producto.codigo})?`
    );

    if (!confirmado) return;

    setError(null);
    setExito(null);
    setCargando(true);
    try {
      await eliminarProducto(producto.id);
      setExito(`Producto "${producto.nombre}" eliminado exitosamente.`);

      // Si se estaba editando este producto, se cancela la edición
      if (editandoId === producto.id) {
        handleCancelar();
      }

      await cargarListaProductos();
    } catch (err) {
      setError(err.message || 'Error al eliminar el producto.');
    } finally {
      setCargando(false);
    }
  }

  // Formato para moneda de Costa Rica (Colones ₡)
  function formatoColones(monto) {
    return '₡' + Number(monto).toLocaleString('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div className="pos-app">
      <header className="pos-header">
        <h1>POS · Productos</h1>
        <p className="subtitle">Gestión de inventario y catálogo de productos</p>
      </header>

      <main className="pos-main">
        {/* Notificaciones */}
        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️ {error}</span>
            <button className="alert-close" onClick={() => setError(null)} title="Cerrar">
              ✕
            </button>
          </div>
        )}

        {exito && (
          <div className="alert alert-success" role="status">
            <span>✅ {exito}</span>
            <button className="alert-close" onClick={() => setExito(null)} title="Cerrar">
              ✕
            </button>
          </div>
        )}

        {/* Formulario Crear / Editar */}
        <section className="form-card">
          <h2>{editandoId ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="codigo">Código *</label>
                <input
                  id="codigo"
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  placeholder="Ej. BEB001"
                  required
                  onInvalid={handleInvalid}
                  disabled={guardando}
                />
              </div>

              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej. Café Molido 500g"
                  required
                  onInvalid={handleInvalid}
                  disabled={guardando}
                />
              </div>

              <div className="form-group">
                <label htmlFor="categoria">Categoría *</label>
                <input
                  id="categoria"
                  type="text"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  placeholder="Ej. Bebidas"
                  required
                  onInvalid={handleInvalid}
                  disabled={guardando}
                />
              </div>

              <div className="form-group">
                <label htmlFor="precio">Precio (₡) *</label>
                <input
                  id="precio"
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  placeholder="Ej. 2500"
                  step="0.01"
                  min="0.01"
                  required
                  onInvalid={handleInvalid}
                  disabled={guardando}
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock *</label>
                <input
                  id="stock"
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="Ej. 50"
                  step="1"
                  min="0"
                  required
                  onInvalid={handleInvalid}
                  disabled={guardando}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                onClick={(e) => limpiarValidacion(e.currentTarget.form)}
                disabled={guardando}
              >
                {guardando
                  ? 'Guardando...'
                  : editandoId
                  ? 'Guardar cambios'
                  : 'Guardar'}
              </button>

              {editandoId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelar}
                  disabled={guardando}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Listado de Productos */}
        <section className="table-card">
          <div className="table-header">
            <h2>Inventario de Productos ({productos.length})</h2>
            <button
              className="btn btn-outline"
              onClick={cargarListaProductos}
              disabled={cargando}
              title="Recargar lista"
            >
              🔄 {cargando ? 'Cargando...' : 'Actualizar lista'}
            </button>
          </div>

          {cargando && productos.length === 0 ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando productos...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="empty-state">
              <p>No hay productos registrados en el sistema.</p>
              <p className="empty-hint">Utiliza el formulario superior para registrar el primero.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th className="text-right">Precio</th>
                    <th className="text-center">Stock</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod) => (
                    <tr
                      key={prod.id}
                      className={editandoId === prod.id ? 'row-editing' : ''}
                    >
                      <td className="code-cell">{prod.codigo}</td>
                      <td className="name-cell">{prod.nombre}</td>
                      <td>
                        <span className="badge category-badge">
                          {prod.categoria}
                        </span>
                      </td>
                      <td className="price-cell text-right">
                        {formatoColones(prod.precio)}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge stock-badge ${
                            prod.stock <= 5 ? 'stock-low' : 'stock-ok'
                          }`}
                        >
                          {prod.stock}
                        </span>
                      </td>
                      <td className="actions-cell text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-edit"
                          onClick={() => handleEditar(prod)}
                          title="Editar producto"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-delete"
                          onClick={() => handleEliminar(prod)}
                          title="Eliminar producto"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
