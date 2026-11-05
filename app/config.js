// Configuración compartida de Mi Invitación Digital (autoservicio)
window.INV = {
  SUPABASE_URL: 'https://ytxnmscxyjttqftmznqj.supabase.co',
  SUPABASE_KEY: 'sb_publishable_T3LJo-8teMIkimAtHitGWA_XKjzDBP5',
  FUNCION: 'https://ytxnmscxyjttqftmznqj.supabase.co/functions/v1/invitaciones',
  BASE: 'https://incubadoradenegociosempresas-droid.github.io/mi-invitacion-digital',
  KARINA: '524772532911',
  PLANES: {
    basica: { nombre: 'Básica', precio: 350, rango: 1 },
    interactiva: { nombre: 'Interactiva', precio: 990, rango: 2 },
    premium: { nombre: 'Premium', precio: 1900, rango: 3 },
    especial: { nombre: 'Especial', precio: 3000, rango: 4 }
  },
  // Ligas de Stripe para pagar SOLO la diferencia (creadas 4-nov-2026)
  MEJORAS: {
    basica_interactiva: 'https://buy.stripe.com/aFa6oH8mkcG5bAx79CafS0S',
    basica_premium: 'https://buy.stripe.com/6oU14nfOM21r9sp8dGafS0T',
    basica_especial: 'https://buy.stripe.com/eVqaEX464bC1341dy0afS0U',
    interactiva_premium: 'https://buy.stripe.com/28E4gzgSQ9tTcEBctWafS0V',
    interactiva_especial: 'https://buy.stripe.com/fZu4gz6ecfSh7khgKcafS0W',
    premium_especial: 'https://buy.stripe.com/14A9ATfOMcG5awtgKcafS0X'
  },
  INCLUYE: {
    basica: ['Elige plantilla y colores', 'Nombres, fecha y mensaje', 'Foto de portada', 'Ubicación con mapa y botón "Cómo llegar"', 'Cuenta regresiva', 'Botón "Agregar a mi calendario"', 'Cambios ilimitados hasta tu evento'],
    interactiva: ['Todo lo de Básica', 'Confirmación de asistencia con tu lista en tiempo real', 'Galería de hasta 12 fotos', 'Música de fondo', 'Itinerario del evento', 'Código de vestimenta'],
    premium: ['Todo lo de Interactiva', 'Pases personalizados: cada invitado recibe su liga con su nombre y sus lugares', 'Mesa de regalos y datos para depósito', 'Padrinos y hospedaje', 'Galería de hasta 30 fotos', 'Descarga tu lista de invitados en Excel'],
    especial: ['Todo lo de Premium', 'Sobre animado que se abre al entrar', 'Efecto de pétalos, brillos o confeti', 'Libro de buenos deseos: tus invitados te dejan mensajes', 'Galería de hasta 60 fotos', 'Sin la marca de Mi Invitación Digital']
  }
};
