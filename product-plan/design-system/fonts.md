# Typography Configuration

## Google Fonts Import

Add to your HTML `<head>` or CSS:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## Font Usage

- **Headings:** Space Grotesk — Page titles, section headings, stat numbers, nav labels
- **Body text:** Inter — Paragraphs, table content, form fields, descriptions
- **Code/technical:** Source Code Pro — IDs, currency amounts, monospace data, timestamps

## Application Pattern

```css
/* Applied via inline styles in components */
style={{ fontFamily: "'Space Grotesk', sans-serif" }}  /* headings */
style={{ fontFamily: "'Inter', sans-serif" }}           /* body (set on page root) */
style={{ fontFamily: "'Source Code Pro', monospace" }}   /* mono values */
```
