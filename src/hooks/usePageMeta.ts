import { useEffect } from "react";

type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
};

export const usePageMeta = ({ title, description, canonical, schema }: PageMeta) => {
  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attribute: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        const [key, keyValue] = attribute.split("=");
        element.setAttribute(key, keyValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", value);
    };

    setMeta('meta[name="description"]', "name=description", description);
    setMeta('meta[property="og:title"]', "property=og:title", title);
    setMeta('meta[property="og:description"]', "property=og:description", description);
    setMeta('meta[property="og:url"]', "property=og:url", canonical);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    const schemaId = "page-schema";
    document.getElementById(schemaId)?.remove();
    if (schema) {
      const script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => document.getElementById(schemaId)?.remove();
  }, [canonical, description, schema, title]);
};
