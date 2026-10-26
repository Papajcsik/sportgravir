/** Static pages (about, delivery, references, engraving) and the articles of the blog; the live site's text is a static seed, the admin edits on top of it. */
export type Gallery = { src: string; alt: string; w: number; h: number }[];

export type Page = {
  id: number;
  /** the address of the live site, without the leading slash ("cegrol", "hasznos-informaciok/834-…") */
  path: string;
  title: string;
  kind: "page" | "article";
  /** publication date of an article as the live site prints it */
  date?: string;
  html: string;
  gallery?: Gallery;
  hidden?: boolean;
  /** edited in the admin */
  custom?: boolean;
  updated?: string;
};
