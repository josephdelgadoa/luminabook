export interface Chapter {
    id: string;
    title: string;
    content: string;
    summary?: string;
    imagePrompt?: string;
    imageUrl?: string;
}

export interface BookTheme {
    id: 'modern' | 'minimalist' | 'bold';
    name: string;
    fontHeading: string;
    fontBody: string;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
}

export interface EBook {
    title: string;
    author: string;
    authorBio?: string;
    authorImageUrl?: string;
    description: string;
    coverImagePrompt?: string;
    coverImageUrl?: string;
    backCoverImagePrompt?: string;
    backCoverImageUrl?: string;
    chapters: Chapter[];
    theme: BookTheme;
}

export interface ExportConfig {
    format: 'pdf' | 'epub' | 'kpf';
    pageSize: 'a4' | 'letter' | 'pocket';
    bleed: boolean;
}

export type AppStep = 'manuscript' | 'visual' | 'export';
