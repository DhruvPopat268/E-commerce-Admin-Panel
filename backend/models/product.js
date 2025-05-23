import mongoose, { Schema, Document, model } from "mongoose"

export interface IAttribute {
  name: string
  values: string // comma-separated or pipe-separated string (e.g., "Red,Blue,Green")
}

export interface IProduct extends Document {
  name: string
  description: string
  category: string
  subCategory: string
  image: string
  visibility: boolean
  tags: string[]
  attributes: IAttribute[]
}

const AttributeSchema = new Schema<IAttribute>({
  name: { type: String, required: true },
  values: { type: String, required: true },
})

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    image: { type: String, required: true }, // store URL or base64
    visibility: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    attributes: { type: [AttributeSchema], default: [] },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Product || model<IProduct>("Product", ProductSchema)
