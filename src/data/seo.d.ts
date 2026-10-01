export type SeoRecord = Record<string, unknown>;

export interface SeoContent {
  profile?: SeoRecord;
  projects?: SeoRecord[];
  editorial?: SeoRecord[];
  sketches?: SeoRecord[];
  siteUrl?: string;
}

export interface SeoPage {
  path: string;
  kind: "home" | "portfolio" | "about" | "editorial" | "sketches" | "project" | "notFound" | "admin";
  siteName: string;
  canonical: string;
  title: string;
  description: string;
  image: string;
  robots: string;
  sensitive: boolean;
  project?: SeoRecord;
  context: Required<SeoContent>;
}

export const SITE_URL: string;
export const PERSON_NAME: string;
export function absoluteSeoUrl(value: unknown, siteUrl?: string): string;
export function getSeoForPath(pathname: string, content?: SeoContent): SeoPage;
export function getStructuredData(page: SeoPage, image?: string, content?: SeoContent): SeoRecord | null;
