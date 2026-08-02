export type TrankaLocale = "es-AR" | "es" | "en" | "pt-BR";

export function normalizeLocale(value: string): TrankaLocale {
  const normalized = value.replaceAll("_", "-").toLowerCase();
  if (normalized.startsWith("es-ar")) return "es-AR";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("pt")) return "pt-BR";
  return "es-AR";
}

const copies = {
  "es-AR": {
    homeTitle: "Abrí el enlace que te compartieron.",
    homeBody:
      "Los viajes compartidos de Tranka se ven desde su enlace privado y temporal.",
    preparing: "Preparando el viaje…",
    live: "En vivo",
    reconnecting: "Reconectando…",
    invalidTitle: "Este viaje no está disponible",
    invalidBody:
      "El enlace puede haber vencido, sido cancelado o dejado de compartirse.",
    onTheWay: (name: string) => `${name} sigue de viaje`,
    arriving: (name: string) => `${name} está llegando`,
    arrived: (name: string, destination: string) =>
      `${name} llegó a ${destination}`,
    cancelled: "Viaje cancelado",
    revoked: "Dejó de compartir",
    completed: "Viaje finalizado",
    origin: "Origen",
    destination: "Destino",
    lastUpdate: "Última actualización",
    now: "Ahora",
    minutesAgo: (minutes: number) =>
      `Hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`,
    recenter: "Recentrar mapa",
    notify: "Avisame cuando llegue",
    notifyEnabled: "Te vamos a avisar cuando llegue",
    notifyDenied: "Habilitá las notificaciones desde el navegador.",
    iosInstall:
      "En iPhone, agregá esta página a la pantalla de inicio para recibir avisos.",
    route: "Ruta recorrida",
    mapTitle: "Mapa de ruta",
    noLocation: "Esperando la primera ubicación…",
    tripInProgress: "Viaje en curso",
    activeStatus: "Activo",
    departureDone: "Salida (Realizada)",
    enRoute: "En camino",
    nextStop: "Próxima parada",
    arrivingIn: (minutes: number) => `Llegando en ${minutes} min`,
    etaAt: (time: string) => `ETA ${time}`,
    remainingTime: "Tiempo restante",
    distance: "Distancia",
    minutesShort: (minutes: number) => `${minutes} min`,
    sharedBy: "Compartido por",
    sheetExpand: "Ver detalles del viaje",
    sheetCollapse: "Cerrar detalles del viaje",
    liveDisclaimer:
      "La ubicación puede demorarse. Tranka no es un servicio de emergencia.",
    privacy: "Privacidad",
    terms: "Términos",
    legalLinks: "Información legal",
  },
  es: {
    homeTitle: "Abre el enlace que te compartieron.",
    homeBody:
      "Los viajes compartidos de Tranka se consultan desde su enlace privado y temporal.",
    preparing: "Preparando el viaje…",
    live: "En directo",
    reconnecting: "Reconectando…",
    invalidTitle: "Este viaje no está disponible",
    invalidBody:
      "El enlace puede haber vencido, haber sido cancelado o dejado de compartirse.",
    onTheWay: (name: string) => `${name} sigue de viaje`,
    arriving: (name: string) => `${name} está llegando`,
    arrived: (name: string, destination: string) =>
      `${name} llegó a ${destination}`,
    cancelled: "Viaje cancelado",
    revoked: "Dejó de compartir",
    completed: "Viaje finalizado",
    origin: "Origen",
    destination: "Destino",
    lastUpdate: "Última actualización",
    now: "Ahora",
    minutesAgo: (minutes: number) =>
      `Hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`,
    recenter: "Recentrar mapa",
    notify: "Avísame cuando llegue",
    notifyEnabled: "Te avisaremos cuando llegue",
    notifyDenied: "Habilita las notificaciones desde el navegador.",
    iosInstall:
      "En iPhone, añade esta página a la pantalla de inicio para recibir avisos.",
    route: "Ruta recorrida",
    mapTitle: "Mapa de ruta",
    noLocation: "Esperando la primera ubicación…",
    tripInProgress: "Viaje en curso",
    activeStatus: "Activo",
    departureDone: "Salida (Realizada)",
    enRoute: "En camino",
    nextStop: "Próxima parada",
    arrivingIn: (minutes: number) => `Llegando en ${minutes} min`,
    etaAt: (time: string) => `ETA ${time}`,
    remainingTime: "Tiempo restante",
    distance: "Distancia",
    minutesShort: (minutes: number) => `${minutes} min`,
    sharedBy: "Compartido por",
    sheetExpand: "Ver detalles del viaje",
    sheetCollapse: "Cerrar detalles del viaje",
    liveDisclaimer:
      "La ubicación puede retrasarse. Tranka no es un servicio de emergencia.",
    privacy: "Privacidad",
    terms: "Términos",
    legalLinks: "Información legal",
  },
  en: {
    homeTitle: "Open the link someone shared with you.",
    homeBody:
      "Tranka shared trips are available through a private, temporary link.",
    preparing: "Getting the trip ready…",
    live: "Live",
    reconnecting: "Reconnecting…",
    invalidTitle: "This trip is not available",
    invalidBody:
      "The link may have expired, been cancelled, or stopped sharing.",
    onTheWay: (name: string) => `${name} is still travelling`,
    arriving: (name: string) => `${name} is arriving`,
    arrived: (name: string, destination: string) =>
      `${name} arrived at ${destination}`,
    cancelled: "Trip cancelled",
    revoked: "Sharing stopped",
    completed: "Trip finished",
    origin: "Origin",
    destination: "Destination",
    lastUpdate: "Last update",
    now: "Now",
    minutesAgo: (minutes: number) =>
      `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`,
    recenter: "Recenter map",
    notify: "Notify me on arrival",
    notifyEnabled: "We'll let you know when they arrive",
    notifyDenied: "Enable notifications in your browser.",
    iosInstall:
      "On iPhone, add this page to your Home Screen to receive notifications.",
    route: "Route travelled",
    mapTitle: "Route map",
    noLocation: "Waiting for the first location…",
    tripInProgress: "Trip in progress",
    activeStatus: "Active",
    departureDone: "Departure (Done)",
    enRoute: "On the way",
    nextStop: "Next stop",
    arrivingIn: (minutes: number) => `Arriving in ${minutes} min`,
    etaAt: (time: string) => `ETA ${time}`,
    remainingTime: "Time left",
    distance: "Distance",
    minutesShort: (minutes: number) => `${minutes} min`,
    sharedBy: "Shared by",
    sheetExpand: "Show trip details",
    sheetCollapse: "Close trip details",
    liveDisclaimer:
      "Location updates may be delayed. Tranka is not an emergency service.",
    privacy: "Privacy",
    terms: "Terms",
    legalLinks: "Legal information",
  },
  "pt-BR": {
    homeTitle: "Abra o link que compartilharam com você.",
    homeBody:
      "As viagens compartilhadas da Tranka ficam disponíveis em um link privado e temporário.",
    preparing: "Preparando a viagem…",
    live: "Ao vivo",
    reconnecting: "Reconectando…",
    invalidTitle: "Esta viagem não está disponível",
    invalidBody:
      "O link pode ter expirado, sido cancelado ou deixado de ser compartilhado.",
    onTheWay: (name: string) => `${name} continua em viagem`,
    arriving: (name: string) => `${name} está chegando`,
    arrived: (name: string, destination: string) =>
      `${name} chegou a ${destination}`,
    cancelled: "Viagem cancelada",
    revoked: "Parou de compartilhar",
    completed: "Viagem finalizada",
    origin: "Origem",
    destination: "Destino",
    lastUpdate: "Última atualização",
    now: "Agora",
    minutesAgo: (minutes: number) =>
      `Há ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`,
    recenter: "Recentralizar mapa",
    notify: "Avise quando chegar",
    notifyEnabled: "Vamos avisar quando chegar",
    notifyDenied: "Ative as notificações no navegador.",
    iosInstall:
      "No iPhone, adicione esta página à Tela de Início para receber avisos.",
    route: "Rota percorrida",
    mapTitle: "Mapa da rota",
    noLocation: "Aguardando a primeira localização…",
    tripInProgress: "Viagem em andamento",
    activeStatus: "Ativo",
    departureDone: "Saída (Realizada)",
    enRoute: "A caminho",
    nextStop: "Próxima parada",
    arrivingIn: (minutes: number) => `Chegando em ${minutes} min`,
    etaAt: (time: string) => `ETA ${time}`,
    remainingTime: "Tempo restante",
    distance: "Distância",
    minutesShort: (minutes: number) => `${minutes} min`,
    sharedBy: "Compartilhado por",
    sheetExpand: "Ver detalhes da viagem",
    sheetCollapse: "Fechar detalhes da viagem",
    liveDisclaimer:
      "A localização pode atrasar. A Tranka não é um serviço de emergência.",
    privacy: "Privacidade",
    terms: "Termos",
    legalLinks: "Informações legais",
  },
} as const;

export function copyFor(locale: TrankaLocale) {
  return copies[locale];
}
