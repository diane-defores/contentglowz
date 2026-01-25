# 📧 Intégration Paced Email - Robot Newsletter

## Vue d'ensemble
Paced Email offre une API simple pour **envoi** d'emails transactionnels et newsletters. Alternative moderne à SendGrid/Mailgun avec focus simplicité.

**Note** : Pour la **réception** d'emails et veille concurrentielle, utiliser EmailIt (voir emailit.md).

## API Principale

### Envoi Email
```bash
POST https://api.paced.email/v1/send
Authorization: Bearer YOUR_API_KEY

{
  "to": "recipient@example.com",
  "from": "newsletter@domain.com",
  "subject": "Votre Newsletter Hebdomadaire",
  "html": "<html><body>Contenu newsletter...</body></html>",
  "tags": ["newsletter", "hebdomadaire"]
}
```

### Gestion Templates
```bash
# Créer template
POST /v1/templates
{
  "name": "newsletter_template",
  "subject": "Newsletter {{week}}",
  "html": "<html>{{content}}</html>"
}

# Envoyer avec template
POST /v1/send
{
  "to": "user@example.com",
  "template": "newsletter_template",
  "data": {"week": "42", "content": "<p>Hello World</p>"}
}
```

## Intégration Robot Newsletter

### Workflow Automatisé
```python
# Dans newsletter_agent.py
import requests

def send_newsletter(content_html, recipients):
    api_key = os.getenv('PACED_EMAIL_API_KEY')
    
    for email in recipients:
        response = requests.post(
            'https://api.paced.email/v1/send',
            headers={'Authorization': f'Bearer {api_key}'},
            json={
                'to': email,
                'from': 'newsletter@winflowz.com',
                'subject': f'Newsletter #{get_week_number()}',
                'html': content_html,
                'tags': ['newsletter', 'automated']
            }
        )
        if response.status_code != 200:
            logger.error(f"Échec envoi {email}: {response.text}")
```

### Avantages pour Notre Robot
- **Simplicité** : API REST standard, pas de complexité SMTP
- **Fiabilité** : Gestion bounce/spam automatique
- **Templates** : Personnalisation sans code complexe
- **Analytics** : Tracking ouverture/clics intégré
- **Coûts** : Pay-as-you-send abordable

### Configuration
```bash
# .env
PACED_EMAIL_API_KEY=your_key_here
FROM_EMAIL=newsletter@yourdomain.com
```

### Métriques Intégration
- **Taux Livraison** : 99%+ (promis par Paced)
- **Temps Envoi** : <2s par email
- **Cout** : ~$0.001/email (vérifier pricing actuel)

## Ressources
- **Docs** : https://docs.paced.email/collection/38-api
- **Dashboard** : https://app.paced.email
- **Pricing** : https://paced.email/pricing

Alternative idéale pour remplacer EmailIt dans notre pipeline newsletter.</content>
<parameter name="filePath">docs/tools/paced-email.md