export interface Category {
    description: string;
    id_category:  number;
    id_parent_category: number | null;
    image_url: string;
    name: string;
    status: "active" | "inactive"
}