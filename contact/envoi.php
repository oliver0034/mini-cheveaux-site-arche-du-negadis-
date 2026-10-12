<?php
/* Envoi du formulaire de contact (contact/index.html) par e-mail.
   Ajouté le 12/10/2026. Appelé par assets/script.js, qui attend du JSON ; sans JavaScript,
   le navigateur poste ici directement et reçoit une courte page HTML.

   Règle tenue par ce fichier : la réponse n'annonce un succès que si le serveur de
   messagerie de l'hébergement a accepté le message. Cela ne garantit pas l'arrivée en
   boîte de réception (filtre anti-spam du destinataire) : seul un envoi de test le prouve. */

const DESTINATAIRE = 'sarahespinas@gmail.com';
/* L'expéditeur doit être une adresse du domaine hébergé (consigne de l'hébergeur pour mail()).
   Ce n'est pas une boîte relevée : la réponse part vers le visiteur, grâce à Reply-To. */
const EXPEDITEUR = 'formulaire@arche-negadis.fr';
const OBJETS = [
  'poulain' => "Acquisition d'un poulain",
  'saillie' => 'Saillie / Programme de reproduction',
  'pension' => 'Pension équine',
  'gite'    => 'Réservation gîte',
  'visite'  => "Visite de l'élevage",
  'autre'   => 'Autre',
];
const LONGUEURS = ['prenom' => 80, 'nom' => 80, 'email' => 254, 'telephone' => 30, 'message' => 5000];
const ECHEC = "Votre message n'a pas pu être envoyé. Réessayez dans un instant, ou contactez-nous par téléphone, WhatsApp ou e-mail.";

function repondre($code, $ok, $message) {
  http_response_code($code);
  header('Cache-Control: no-store');
  header('X-Robots-Tag: noindex');
  header('X-Content-Type-Options: nosniff');
  if (strpos(isset($_SERVER['HTTP_ACCEPT']) ? $_SERVER['HTTP_ACCEPT'] : '', 'application/json') !== false) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
  }
  header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
    . '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">'
    . '<title>Contact — L\'Arche du Négadis</title></head>'
    . '<body style="margin:0;padding:15vh 1.5rem;background:#131313;color:#d0c5af;font:1.05rem/1.7 Georgia,serif;text-align:center">'
    . '<p style="max-width:34rem;margin:0 auto 2rem">' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p><a href="/contact/" style="color:#f2ca50">Retour à la page contact</a></p></body></html>';
  exit;
}

/* Champ sur une ligne : sans caractère de contrôle, donc inutilisable pour glisser un en-tête d'e-mail. */
function ligne($nom) {
  $v = isset($_POST[$nom]) ? $_POST[$nom] : '';
  if (!is_string($v)) return '';
  return trim(preg_replace('/[\x00-\x1F\x7F]+/', ' ', $v));
}

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Allow: POST');
  repondre(405, false, 'Cette adresse ne sert qu\'à l\'envoi du formulaire de contact.');
}
if ((int) (isset($_SERVER['CONTENT_LENGTH']) ? $_SERVER['CONTENT_LENGTH'] : 0) > 100000) {
  repondre(413, false, ECHEC);
}

/* Champ piège : invisible pour un visiteur, rempli par les robots qui complètent tout. */
if (ligne('site_web') !== '') {
  repondre(400, false, ECHEC);
}

$prenom    = ligne('prenom');
$nom       = ligne('nom');
$email     = ligne('email');
$telephone = ligne('telephone');
$objet     = ligne('objet');
$message   = isset($_POST['message']) && is_string($_POST['message']) ? $_POST['message'] : '';
$message   = trim(preg_replace('/\r\n?|\n/', "\r\n", preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $message)));

$champs = ['prenom' => $prenom, 'nom' => $nom, 'email' => $email, 'telephone' => $telephone, 'message' => $message];
foreach ($champs as $cle => $valeur) {
  if (!mb_check_encoding($valeur, 'UTF-8')) {
    repondre(422, false, ECHEC);
  }
  if (mb_strlen($valeur, 'UTF-8') > LONGUEURS[$cle]) {
    repondre(422, false, 'Un des champs est trop long (message : 5 000 caractères au plus). Merci de le raccourcir.');
  }
}

$manquants = [];
if ($prenom === '') $manquants[] = 'votre prénom';
if ($nom === '') $manquants[] = 'votre nom';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $manquants[] = 'une adresse e-mail valide';
if (!array_key_exists($objet, OBJETS)) $manquants[] = 'l\'objet de votre demande';
if ($message === '') $manquants[] = 'votre message';
if (empty($_POST['rgpd'])) $manquants[] = 'votre accord pour le traitement de vos données';
if ($manquants) {
  repondre(422, false, 'Il manque : ' . implode(', ', $manquants) . '.');
}

$maintenant = new DateTime('now', new DateTimeZone('Europe/Paris'));
$corps = implode("\r\n", [
  'Nouveau message reçu par le formulaire de contact du site arche-negadis.fr.',
  '',
  'Prénom : ' . $prenom,
  'Nom : ' . $nom,
  'E-mail : ' . $email,
  'Téléphone : ' . ($telephone !== '' ? $telephone : 'non indiqué'),
  'Objet : ' . OBJETS[$objet],
  '',
  'Message :',
  $message,
  '',
  '-- ',
  'Envoyé le ' . $maintenant->format('d/m/Y') . ' à ' . $maintenant->format('H:i') . ' (heure de Paris).',
  'Pour répondre au visiteur, utilisez « Répondre » : la réponse part vers son adresse.',
]);

mb_internal_encoding('UTF-8');
$sujet = mb_encode_mimeheader('Contact site — ' . OBJETS[$objet] . ' — ' . mb_substr($prenom . ' ' . $nom, 0, 60), 'UTF-8', 'B', "\r\n", 9);
$entetes = [
  'From'                      => '"Formulaire arche-negadis.fr" <' . EXPEDITEUR . '>',
  'Reply-To'                  => $email,
  'MIME-Version'              => '1.0',
  'Content-Type'              => 'text/plain; charset=UTF-8',
  'Content-Transfer-Encoding' => 'quoted-printable',
];

try {
  $envoye = mail(DESTINATAIRE, $sujet, quoted_printable_encode($corps), $entetes);
} catch (Throwable $e) {
  $envoye = false;
}
if (!$envoye) {
  repondre(500, false, ECHEC);
}
repondre(200, true, 'Votre message a bien été envoyé. Nous vous répondrons au plus vite.');
