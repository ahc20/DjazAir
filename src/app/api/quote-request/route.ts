import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const RECIPIENT_EMAIL = "ahcene201@hotmail.fr"; // Email vérifié sur Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Type pour les données de la demande
interface QuoteRequestBody {
  fullName: string;
  email: string;
  phone: string;
  comment?: string;
  flight: {
    origin: string;
    destination: string;
    departDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    estimatedPrice: number;
    flightDetails?: {
      segments: Array<{
        airline: string;
        flightNumber: string;
        origin: string;
        destination: string;
        departureTime: string;
        arrivalTime: string;
      }>;
    };
  };
}

// Formater la date
function formatDate(dateStr: string): string {
  if (!dateStr) return "Non spécifié";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Générer le template email HTML
function generateEmailHTML(data: QuoteRequestBody): string {
  const { fullName, email, phone, comment, flight } = data;

  const segmentsHTML = flight.flightDetails?.segments
    ? flight.flightDetails.segments
      .map(
        (seg) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px;">${seg.airline} ${seg.flightNumber}</td>
            <td style="padding: 8px;">${seg.origin} → ${seg.destination}</td>
            <td style="padding: 8px;">${new Date(seg.departureTime).toLocaleString("fr-FR")}</td>
          </tr>
        `
      )
      .join("")
    : "<tr><td colspan='3' style='padding: 8px; color: #6b7280;'>Détails non disponibles</td></tr>";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
    .content { background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
    .section { background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e5e7eb; }
    .section-title { font-weight: 600; color: #059669; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .info-label { color: #6b7280; }
    .info-value { font-weight: 500; }
    .price { font-size: 24px; font-weight: 700; color: #059669; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px; background: #f3f4f6; color: #374151; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">🛫 Nouvelle Demande de Devis</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">${flight.origin} → ${flight.destination}</p>
    </div>
    
    <div class="content">
      <!-- Client Info -->
      <div class="section">
        <div class="section-title">👤 Informations Client</div>
        <div class="info-row">
          <span class="info-label">Nom</span>
          <span class="info-value">${fullName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value"><a href="mailto:${email}" style="color: #059669;">${email}</a></span>
        </div>
        <div class="info-row">
          <span class="info-label">Téléphone</span>
          <span class="info-value"><a href="tel:${phone}" style="color: #059669;">${phone}</a></span>
        </div>
      </div>
      
      <!-- Flight Info -->
      <div class="section">
        <div class="section-title">✈️ Détails du Trajet</div>
        <div class="info-row">
          <span class="info-label">Trajet</span>
          <span class="info-value" style="font-weight: 600;">${flight.origin} → ${flight.destination}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date départ</span>
          <span class="info-value">${formatDate(flight.departDate)}</span>
        </div>
        ${flight.returnDate ? `
        <div class="info-row">
          <span class="info-label">Date retour</span>
          <span class="info-value">${formatDate(flight.returnDate)}</span>
        </div>
        ` : `
        <div class="info-row">
          <span class="info-label">Type</span>
          <span class="info-value">Aller simple</span>
        </div>
        `}
        <div class="info-row">
          <span class="info-label">Passagers</span>
          <span class="info-value">
            ${flight.adults} adulte${flight.adults > 1 ? "s" : ""}
            ${flight.children > 0 ? `, ${flight.children} enfant${flight.children > 1 ? "s" : ""}` : ""}
            ${flight.infants > 0 ? `, ${flight.infants} bébé${flight.infants > 1 ? "s" : ""}` : ""}
          </span>
        </div>
      </div>
      
      <!-- Price -->
      <div class="section" style="text-align: center; background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%);">
        <div class="section-title" style="justify-content: center;">💰 Prix Estimé</div>
        <div class="price">~${flight.estimatedPrice}€</div>
        <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">Via Alger (ALG)</p>
      </div>
      
      <!-- Flight Segments -->
      ${flight.flightDetails?.segments ? `
      <div class="section">
        <div class="section-title">📍 Segments de Vol</div>
        <table>
          <thead>
            <tr>
              <th>Vol</th>
              <th>Trajet</th>
              <th>Départ</th>
            </tr>
          </thead>
          <tbody>
            ${segmentsHTML}
          </tbody>
        </table>
      </div>
      ` : ""}
      
      <!-- Comment -->
      ${comment ? `
      <div class="section">
        <div class="section-title">📝 Commentaire du Client</div>
        <p style="margin: 0; color: #374151; white-space: pre-wrap;">${comment}</p>
      </div>
      ` : ""}
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          Demande envoyée depuis DjazAir • ${new Date().toLocaleString("fr-FR")}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// Générer le template email texte (fallback)
function generateEmailText(data: QuoteRequestBody): string {
  const { fullName, email, phone, comment, flight } = data;

  return `
📋 NOUVELLE DEMANDE DE DEVIS DJAZAIR
=====================================

👤 CLIENT
---------
Nom: ${fullName}
Email: ${email}
Téléphone: ${phone}

✈️ TRAJET
---------
${flight.origin} → ${flight.destination}
Date départ: ${formatDate(flight.departDate)}
Date retour: ${flight.returnDate ? formatDate(flight.returnDate) : "Aller simple"}
Passagers: ${flight.adults} adulte(s)${flight.children > 0 ? `, ${flight.children} enfant(s)` : ""}${flight.infants > 0 ? `, ${flight.infants} bébé(s)` : ""}

💰 ESTIMATION
-------------
Prix affiché: ~${flight.estimatedPrice}€
Via: Alger (ALG)

${comment ? `📝 COMMENTAIRE\n--------------\n${comment}` : ""}

---
Demande envoyée depuis DjazAir • ${new Date().toLocaleString("fr-FR")}
`;
}

export async function POST(request: NextRequest) {
  try {
    const body: QuoteRequestBody = await request.json();

    // Validation des champs requis
    if (!body.fullName || !body.email || !body.phone || !body.flight) {
      return NextResponse.json(
        { success: false, message: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: "Email invalide" },
        { status: 400 }
      );
    }

    // Vérifier la clé API Resend
    if (!process.env.RESEND_API_KEY) {
      console.log("⚠️ Mode développement: Email non envoyé (pas de clé Resend)");
      console.log("📧 Contenu de l'email:");
      console.log(generateEmailText(body));
      return NextResponse.json({
        success: true,
        message: "Demande enregistrée (mode développement)",
      });
    }

    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: "DjazAir <onboarding@resend.dev>",
      to: [RECIPIENT_EMAIL],
      replyTo: body.email,
      subject: `🛫 Nouvelle Demande DjazAir: ${body.flight.origin} → ${body.flight.destination}`,
      html: generateEmailHTML(body),
      text: generateEmailText(body),
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return NextResponse.json(
        { success: false, message: "Erreur lors de l'envoi. Veuillez réessayer." },
        { status: 500 }
      );
    }

    console.log(`✅ Email envoyé via Resend (ID: ${data?.id}) à ${RECIPIENT_EMAIL}`);

    return NextResponse.json({
      success: true,
      message: "Votre demande a bien été envoyée !",
    });
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'envoi. Veuillez réessayer.",
      },
      { status: 500 }
    );
  }
}
