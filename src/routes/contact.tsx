import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStorefront } from "@/lib/storefront";
import { SectionRenderer } from "@/components/sections";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Our Store" },
      { name: "description", content: "Get in touch with us." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { pages, navbar } = useStorefront();

  useEffect(() => {
    document.title = `Contact — ${navbar.brand}`;
  }, [navbar.brand]);

  const contactSections = pages.find((p) => p.slug === "/contact")?.sections ?? [];

  if (contactSections.length > 0) {
    return (
      <div>
        {contactSections.map((s) => <SectionRenderer key={s.id} section={s} />)}
      </div>
    );
  }

  // Default fallback when no sections are configured
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
      <h1 className="mt-3 font-serif text-5xl leading-tight md:text-6xl">Get in touch.</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Add a Contact section to this page from the editor to display your contact details and a message form.
      </p>
    </div>
  );
}
