import { Button } from './Button';
// Compile-time contract; this function is never rendered.
export function buttonTypeContract() {
  const icon = <svg />;
  return <>
    <Button variant="icon" icon={icon} aria-label="Uložit" />
    <Button variant="icon" icon={icon} aria-labelledby="external-label" />
    <Button variant="primary" size="large" motion="star-border">Uložit</Button>
    {/* @ts-expect-error Icon-only controls require an accessible name. */}
    <Button variant="icon" icon={icon} />
    {/* @ts-expect-error Icon-only controls require an icon. */}
    <Button variant="icon" aria-label="Uložit" />
    {/* @ts-expect-error Size and variant are independent closed unions. */}
    <Button size="primary">Uložit</Button>
    {/* @ts-expect-error A link is not a button; polymorphism is intentionally unsupported. */}
    <Button href="/">Uložit</Button>
  </>;
}
