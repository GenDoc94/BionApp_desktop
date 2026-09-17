import * as React from "react";
import { type VariantProps } from "class-variance-authority@0.7.1";
declare const badgeVariants: any;
declare function Badge({ className, variant, asChild, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
}): React.JSX.Element;
export { Badge, badgeVariants };
