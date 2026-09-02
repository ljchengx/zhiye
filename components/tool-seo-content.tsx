import Link from "next/link";

import { toolDefinitions, type ToolDefinitionBase } from "@/lib/tools/registry";

const siteUrl = "https://www.yzfl.top";

interface ToolSeoContentProps {
  definition: ToolDefinitionBase;
  relatedTools?: readonly ToolDefinitionBase[];
  pagePath?: string;
  productName?: string;
  productPath?: string;
  applicationCategory?: string;
}

export function ToolSeoContent({
  definition,
  relatedTools = toolDefinitions,
  pagePath = `/${definition.path}`,
  productName = "知页",
  productPath = "/",
  applicationCategory = "DeveloperApplication",
}: ToolSeoContentProps) {
  const pageUrl = `${siteUrl}${pagePath}`;
  const brandUrl = `${siteUrl}${productPath}`;
  const related = relatedTools.filter((tool) => tool.slug !== definition.slug);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${pageUrl}#application`,
        name: definition.seo.h1,
        url: pageUrl,
        description: definition.metadata.description,
        applicationCategory,
        operatingSystem: "Any",
        browserRequirements: "Requires a modern web browser",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "CNY",
        },
        isPartOf: {
          "@type": "WebSite",
          name: productName,
          url: brandUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: productName,
            item: brandUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: definition.seo.h1,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: definition.seo.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <section className="tool-seo-content" aria-labelledby="tool-seo-title">
        <div className="tool-seo-content__intro">
          <p className="tool-seo-content__eyebrow">工具说明</p>
          <h2 id="tool-seo-title">{definition.seo.heading}</h2>
          <p>{definition.seo.intro}</p>
        </div>

        <div className="tool-seo-content__grid">
          <section aria-labelledby="tool-features-title">
            <h3 id="tool-features-title">支持的功能</h3>
            <ul>
              {definition.seo.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </section>
          <section aria-labelledby="tool-steps-title">
            <h3 id="tool-steps-title">使用方法</h3>
            <ol>
              {definition.seo.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>
        </div>

        <div className="tool-seo-content__article">
          {definition.seo.sections.map((section, index) => (
            <section key={section.heading} aria-labelledby={`tool-section-${index}`}>
              <h3 id={`tool-section-${index}`}>{section.heading}</h3>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </div>

        <section className="tool-seo-content__faq" aria-labelledby="tool-faq-title">
          <h3 id="tool-faq-title">常见问题</h3>
          <div>
            {definition.seo.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 ? (
          <nav className="tool-seo-content__related" aria-labelledby="related-tools-title">
            <h3 id="related-tools-title">相关工具</h3>
            <ul>
              {related.map((tool) => (
                <li key={tool.slug}>
                  <Link href={tool.href ?? `/${tool.path}`}>
                    <span>{tool.title}</span>
                    <small>{tool.seo.summary}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
