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

export function mensajeValidacion(input) {
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

export function handleInvalid(e) {
  e.target.setCustomValidity(mensajeValidacion(e.target));
}

// Limpia los mensajes personalizados para que el navegador vuelva a evaluar los campos.
export function limpiarValidacion(form) {
  if (!form) return;
  Array.from(form.elements).forEach((el) => el.setCustomValidity?.(''));
}
