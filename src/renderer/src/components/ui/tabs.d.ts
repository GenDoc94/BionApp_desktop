import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs@1.1.3";
declare function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>): React.JSX.Element;
declare function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>): React.JSX.Element;
declare function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>): React.JSX.Element;
declare function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>): React.JSX.Element;
export { Tabs, TabsList, TabsTrigger, TabsContent };
