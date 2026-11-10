import { MSG } from '../../../shared/config/messages';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../shared/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';

const H = MSG.help;

export default function HelpPage() {
  return (
    <div className="ui mx-auto mt-6 grid max-w-2xl gap-4 px-3">
      <h1 className="text-2xl font-semibold">{H.title}</h1>
      {H.sections.map((s) => (
        <Card key={s.title}>
          <CardHeader><CardTitle>{s.title}</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{s.text}</CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader><CardTitle>{H.statusesTitle}</CardTitle></CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm">
            {H.statuses.map((s) => <li key={s.name}><b>{s.name}</b> — {s.text}</li>)}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{H.faqTitle}</CardTitle></CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {H.faq.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
