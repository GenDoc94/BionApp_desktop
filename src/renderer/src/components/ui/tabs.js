"use client";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import * as TabsPrimitive from "@radix-ui/react-tabs@1.1.3";
import { cn } from "./utils";
function Tabs(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (_jsx(TabsPrimitive.Root, __assign({ "data-slot": "tabs", className: cn("flex flex-col gap-2", className) }, props)));
}
function TabsList(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (_jsx(TabsPrimitive.List, __assign({ "data-slot": "tabs-list", className: cn("bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex", className) }, props)));
}
function TabsTrigger(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (_jsx(TabsPrimitive.Trigger, __assign({ "data-slot": "tabs-trigger", className: cn("data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-border data-[state=active]:shadow-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-muted-foreground data-[state=active]:text-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className) }, props)));
}
function TabsContent(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (_jsx(TabsPrimitive.Content, __assign({ "data-slot": "tabs-content", className: cn("flex-1 outline-none", className) }, props)));
}
export { Tabs, TabsList, TabsTrigger, TabsContent };
