import dripper from "@/assets/product-dripper.jpg";
import bag from "@/assets/product-bag.jpg";
import lamp from "@/assets/product-lamp.jpg";
import headphones from "@/assets/product-headphones.jpg";
import blazer from "@/assets/product-blazer.jpg";
import watch from "@/assets/product-watch.jpg";

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  category: string;
  image: string;
};

export const products: Product[] = [
  { slug: "ceramic-pour-over", name: "Ceramic Pour-Over", tagline: "Slow ritual, perfect cup", description: "A hand-finished matte stoneware dripper designed for a balanced extraction and a quiet morning routine.", price: 38500, category: "Home", image: dripper },
  { slug: "weekender-bag", name: "Weekender Carryall", tagline: "Full-grain leather, made to age", description: "Roomy, structured, and built from vegetable-tanned leather that develops a richer patina with every trip.", price: 195000, category: "Accessories", image: bag },
  { slug: "studio-desk-lamp", name: "Studio Desk Lamp", tagline: "Architectural light", description: "Brushed steel, articulated arm, dimmable warm LED. Designed for long evenings at the desk.", price: 65000, category: "Home", image: lamp },
  { slug: "linen-blazer", name: "Linen Blazer", tagline: "Unstructured, all season", description: "A soft, washed Belgian linen blazer cut for movement. Wear it open over a tee or buttoned with trousers.", price: 115000, category: "Apparel", image: blazer },
  { slug: "field-watch", name: "Field Watch No. 04", tagline: "Quiet timekeeping", description: "A Swiss automatic movement in a 38mm brushed steel case with a hand-stitched cognac leather strap.", price: 285000, category: "Accessories", image: watch },
  { slug: "wireless-headphones", name: "Wireless Headphones", tagline: "Studio sound, all day comfort", description: "40-hour battery, adaptive noise cancellation, and memory-foam earcups wrapped in soft nappa leather.", price: 148000, category: "Tech", image: headphones },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const formatPrice = (n: number) => `₦${n.toLocaleString("en-NG")}`;

/** The 36 Nigerian states (plus FCT) used by the checkout State selector. */
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
  "FCT - Abuja",
];
