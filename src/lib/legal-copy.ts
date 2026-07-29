import type { TrankaLocale } from "@/lib/i18n";

type LegalSection = { title: string; paragraphs: string[] };
type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const updated = "2026-08";

export const privacyDocuments: Record<TrankaLocale, LegalDocument> = {
  "es-AR": {
    title: "Política de privacidad",
    updated: `Versión ${updated}`,
    intro:
      "Esta política explica cómo Tranka trata los datos de los viajes compartidos.",
    sections: [
      {
        title: "Qué se comparte",
        paragraphs: [
          "Cuando activás la función, creamos un enlace temporal que muestra tu nombre, foto de perfil, dirección y coordenadas exactas de origen, destinos, ubicación exacta actual y ruta recorrida.",
          "Cualquiera que tenga el enlace puede verlo y reenviarlo. No publiques el enlace donde no quieras compartir tu ubicación.",
        ],
      },
      {
        title: "Proveedores y notificaciones",
        paragraphs: [
          "Usamos Supabase para autenticación, almacenamiento y tiempo real; Vercel para alojar el visor; CARTO para el mapa; Google para convertir coordenadas en direcciones; y el proveedor Web Push de cada navegador para avisos de llegada.",
          "Una notificación puede mostrar el nombre y destino en la pantalla bloqueada. No incluye el enlace, token ni coordenadas.",
        ],
      },
      {
        title: "Retención, control y seguridad",
        paragraphs: [
          "El enlace vence 24 horas después de finalizar el viaje. Podés dejar de compartir antes y el acceso se revoca de inmediato. Los datos asociados se eliminan después del vencimiento conforme al proceso de retención.",
          "La red, el GPS o el sistema operativo pueden demorar actualizaciones. Tranka no es un servicio de rastreo de emergencia.",
        ],
      },
    ],
  },
  es: {
    title: "Política de privacidad",
    updated: `Versión ${updated}`,
    intro:
      "Esta política explica cómo Tranka trata los datos de los viajes compartidos.",
    sections: [
      {
        title: "Qué se comparte",
        paragraphs: [
          "Cuando activas la función, creamos un enlace temporal que muestra tu nombre, foto de perfil, dirección y coordenadas exactas de origen, destinos, ubicación exacta actual y ruta recorrida.",
          "Cualquiera que tenga el enlace puede verlo y reenviarlo. No publiques el enlace donde no quieras compartir tu ubicación.",
        ],
      },
      {
        title: "Proveedores y notificaciones",
        paragraphs: [
          "Usamos Supabase para autenticación, almacenamiento y tiempo real; Vercel para alojar el visor; CARTO para el mapa; Google para convertir coordenadas en direcciones; y el proveedor Web Push de cada navegador para avisos de llegada.",
          "Una notificación puede mostrar el nombre y destino en la pantalla bloqueada. No incluye el enlace, token ni coordenadas.",
        ],
      },
      {
        title: "Retención, control y seguridad",
        paragraphs: [
          "El enlace vence 24 horas después de finalizar el viaje. Puedes dejar de compartir antes y el acceso se revoca de inmediato. Los datos asociados se eliminan después del vencimiento conforme al proceso de retención.",
          "La red, el GPS o el sistema operativo pueden retrasar actualizaciones. Tranka no es un servicio de rastreo de emergencia.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy policy",
    updated: `Version ${updated}`,
    intro: "This policy explains how Tranka handles shared-trip data.",
    sections: [
      {
        title: "What is shared",
        paragraphs: [
          "When you enable sharing, we create a temporary link showing your name, profile photo, exact origin address and coordinates, destinations, current exact location, and travelled route.",
          "Anyone with the link can view and forward it. Do not post it where you do not want to share your location.",
        ],
      },
      {
        title: "Providers and notifications",
        paragraphs: [
          "We use Supabase for authentication, storage, and real time; Vercel to host the viewer; CARTO for maps; Google to turn coordinates into addresses; and each browser's Web Push provider for arrival alerts.",
          "A notification may show the name and destination on the lock screen. It does not contain the link, token, or coordinates.",
        ],
      },
      {
        title: "Retention, control, and safety",
        paragraphs: [
          "The link expires 24 hours after the trip ends. You can stop sharing sooner and access is revoked immediately. Associated data is deleted after expiry under our retention process.",
          "Network, GPS, or operating-system conditions can delay updates. Tranka is not an emergency tracking service.",
        ],
      },
    ],
  },
  "pt-BR": {
    title: "Política de privacidade",
    updated: `Versão ${updated}`,
    intro:
      "Esta política explica como a Tranka trata os dados de viagens compartilhadas.",
    sections: [
      {
        title: "O que é compartilhado",
        paragraphs: [
          "Ao ativar o recurso, criamos um link temporário que mostra seu nome, foto de perfil, endereço e coordenadas exatas de origem, destinos, localização exata atual e rota percorrida.",
          "Qualquer pessoa com o link pode visualizar e encaminhá-lo. Não publique o link onde você não queira compartilhar sua localização.",
        ],
      },
      {
        title: "Fornecedores e notificações",
        paragraphs: [
          "Usamos Supabase para autenticação, armazenamento e tempo real; Vercel para hospedar o visualizador; CARTO para o mapa; Google para converter coordenadas em endereços; e o provedor Web Push de cada navegador para avisos de chegada.",
          "Uma notificação pode mostrar o nome e o destino na tela bloqueada. Ela não inclui o link, token ou coordenadas.",
        ],
      },
      {
        title: "Retenção, controle e segurança",
        paragraphs: [
          "O link expira 24 horas após o fim da viagem. Você pode parar de compartilhar antes, revogando o acesso imediatamente. Os dados associados são excluídos após o vencimento conforme o processo de retenção.",
          "A rede, o GPS ou o sistema operacional podem atrasar atualizações. A Tranka não é um serviço de rastreamento de emergência.",
        ],
      },
    ],
  },
};

export const termsDocuments: Record<TrankaLocale, LegalDocument> = {
  "es-AR": {
    title: "Términos de uso",
    updated: `Versión ${updated}`,
    intro: "Al usar un enlace de viaje compartido aceptás estas condiciones.",
    sections: [
      {
        title: "Uso del enlace",
        paragraphs: [
          "La persona que viaja decide compartir manualmente y puede revocar el enlace. Quien lo recibe debe usar la información sólo para acompañar ese viaje y evitar su difusión innecesaria.",
        ],
      },
      {
        title: "Alcance del servicio",
        paragraphs: [
          "El visor informa ubicación y progreso aproximados. No ofrece navegación, vigilancia continua, respuesta ante emergencias ni garantía de entrega de notificaciones.",
          "No uses Tranka como único medio para cuidar a una persona o pedir ayuda. Ante una emergencia, contactá a los servicios correspondientes.",
        ],
      },
      {
        title: "Disponibilidad",
        paragraphs: [
          "GPS, batería, conectividad, navegador y sistema operativo pueden interrumpir o demorar el servicio. El enlace deja de funcionar al revocarse o vencer.",
        ],
      },
    ],
  },
  es: {
    title: "Términos de uso",
    updated: `Versión ${updated}`,
    intro: "Al usar un enlace de viaje compartido aceptas estas condiciones.",
    sections: [
      {
        title: "Uso del enlace",
        paragraphs: [
          "La persona que viaja decide compartir manualmente y puede revocar el enlace. Quien lo recibe debe usar la información solo para acompañar ese viaje y evitar su difusión innecesaria.",
        ],
      },
      {
        title: "Alcance del servicio",
        paragraphs: [
          "El visor informa ubicación y progreso aproximados. No ofrece navegación, vigilancia continua, respuesta ante emergencias ni garantía de entrega de notificaciones.",
          "No uses Tranka como único medio para cuidar a una persona o pedir ayuda. Ante una emergencia, contacta con los servicios correspondientes.",
        ],
      },
      {
        title: "Disponibilidad",
        paragraphs: [
          "GPS, batería, conectividad, navegador y sistema operativo pueden interrumpir o retrasar el servicio. El enlace deja de funcionar al revocarse o vencer.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of use",
    updated: `Version ${updated}`,
    intro: "By using a shared-trip link, you agree to these terms.",
    sections: [
      {
        title: "Using the link",
        paragraphs: [
          "The traveller chooses to share manually and can revoke the link. Recipients should use the information only to follow that trip and avoid unnecessary forwarding.",
        ],
      },
      {
        title: "Service scope",
        paragraphs: [
          "The viewer provides approximate location and progress. It does not provide navigation, continuous surveillance, emergency response, or guaranteed notification delivery.",
          "Do not use Tranka as the only way to protect someone or request help. Contact the appropriate services in an emergency.",
        ],
      },
      {
        title: "Availability",
        paragraphs: [
          "GPS, battery, connectivity, browser, and operating-system conditions can interrupt or delay the service. The link stops working when revoked or expired.",
        ],
      },
    ],
  },
  "pt-BR": {
    title: "Termos de uso",
    updated: `Versão ${updated}`,
    intro: "Ao usar um link de viagem compartilhada, você aceita estes termos.",
    sections: [
      {
        title: "Uso do link",
        paragraphs: [
          "A pessoa que viaja escolhe compartilhar manualmente e pode revogar o link. Quem o recebe deve usar as informações apenas para acompanhar essa viagem e evitar encaminhamentos desnecessários.",
        ],
      },
      {
        title: "Escopo do serviço",
        paragraphs: [
          "O visualizador informa localização e progresso aproximados. Ele não oferece navegação, vigilância contínua, resposta a emergências ou garantia de entrega de notificações.",
          "Não use a Tranka como único meio de proteger alguém ou pedir ajuda. Em uma emergência, contate os serviços adequados.",
        ],
      },
      {
        title: "Disponibilidade",
        paragraphs: [
          "GPS, bateria, conectividade, navegador e sistema operacional podem interromper ou atrasar o serviço. O link deixa de funcionar quando é revogado ou expira.",
        ],
      },
    ],
  },
};
