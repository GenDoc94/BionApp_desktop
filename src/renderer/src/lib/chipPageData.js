var FC_SLOTS = [1, 2, 3];
export function groupAsignacionesPorChip(asignaciones) {
    var byChip = new Map();
    for (var _i = 0, asignaciones_1 = asignaciones; _i < asignaciones_1.length; _i++) {
        var row = asignaciones_1[_i];
        var chipNum = Number(row.NumChip);
        var fc = Number(row.FC);
        if (!Number.isFinite(chipNum) || !Number.isFinite(fc))
            continue;
        var fcMap = byChip.get(chipNum);
        if (!fcMap) {
            fcMap = new Map();
            byChip.set(chipNum, fcMap);
        }
        fcMap.set(fc, row);
    }
    return byChip;
}
export function buildChipPanels(chips, asignaciones) {
    var byChip = groupAsignacionesPorChip(asignaciones);
    return chips.map(function (chip) {
        var _a;
        var fcMap = (_a = byChip.get(Number(chip.NumChip_D))) !== null && _a !== void 0 ? _a : new Map();
        return {
            chip: chip,
            flowcells: FC_SLOTS.map(function (fc) { var _a; return (_a = fcMap.get(fc)) !== null && _a !== void 0 ? _a : null; }),
        };
    });
}
function matchesNumericField(value, query) {
    if (value == null || query.trim() === "")
        return false;
    var q = query.trim();
    if (String(value).trim() === q)
        return true;
    var qNum = Number(q);
    var vNum = Number(value);
    return Number.isFinite(qNum) && Number.isFinite(vNum) && qNum === vNum;
}
function matchesTextField(value, query) {
    if (value == null || query.trim() === "")
        return false;
    return String(value).trim().toLowerCase().includes(query.trim().toLowerCase());
}
export function chipPanelMatchesQuery(panel, query) {
    var q = query.trim();
    if (!q)
        return true;
    var chip = panel.chip, flowcells = panel.flowcells;
    var qIsNumeric = /^\d+$/.test(q);
    if (matchesNumericField(chip.NumChip_D, q))
        return true;
    if (!qIsNumeric && matchesTextField(chip.Nombre_Chip, q))
        return true;
    for (var _i = 0, flowcells_1 = flowcells; _i < flowcells_1.length; _i++) {
        var fc = flowcells_1[_i];
        if ((fc === null || fc === void 0 ? void 0 : fc.NumBN_C) != null && matchesNumericField(fc.NumBN_C, q))
            return true;
    }
    return false;
}
export function filterChipPanels(panels, query) {
    var q = query.trim();
    if (!q)
        return panels;
    return panels.filter(function (panel) { return chipPanelMatchesQuery(panel, q); });
}
