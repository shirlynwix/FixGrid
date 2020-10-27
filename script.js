(() => {
    const componentEditorAPI = repluggableAppDebug.utils.findAPI('ComponentEditorAPI')[0].impl()
    const breakpointsDerivativeStateAPI = repluggableAppDebug.utils.findAPI('Breakpoints Derivative State API')[0].impl()
    const componentsDerivativeStateAPI = repluggableAppDebug.utils.findAPI('Components Derivative State API')[1].impl()
    const sectionLayoutPrivateAPI = repluggableAppDebug.utils.findAPI('Section Layout Private API')[0].impl()
    const ds = repluggableAppDebug.utils.findAPI('Document Services API')[0].impl()
    const pageIdList = ds.pages.getPageIdList();

    pageIdList.forEach(pageId => {
        const page = { id: pageId, type: "DESKTOP"}

        // TODO: Needs improvement
        const isVerticalSection = c => {
            if (sectionLayoutPrivateAPI.isVerticalSection(
                c,
                page,
                breakpointsDerivativeStateAPI.getCurrentBreakpointId(c)
            )) return true
            if (!ds.responsiveLayout.get(c).itemLayouts[0].type === 'FixedItemLayout') return false
            const {rowStart, rowEnd} = ds.responsiveLayout.get(c).itemLayouts[0].gridArea
            const isVerticalSection = rowEnd - rowStart > 1
            return isVerticalSection
        }
        const sections = _(ds.components.getChildren(page))
            .filter(c => componentEditorAPI.hasSectionBehaviors(c))
            .filter(c => !isVerticalSection(c))
            .sortBy(v => (ds.responsiveLayout.get(v).itemLayouts[0].gridArea && ds.responsiveLayout.get(v).itemLayouts[0].gridArea.rowStart) || 0)
            .value()
        const verticalSections = _(ds.components.getChildren(page))
            .filter(c => componentEditorAPI.hasSectionBehaviors(c))
            .filter(c => isVerticalSection(c))
            .sortBy(v => (ds.responsiveLayout.get(v).itemLayouts[0].gridArea && ds.responsiveLayout.get(v).itemLayouts[0].gridArea.columnStart) || 0)
            .value()
        // Page
        const oldPageLayout = _.cloneDeep(ds.components.responsiveLayout.get(page))
        const newPageLayout = {
            ...oldPageLayout,
            containerLayouts: oldPageLayout.containerLayouts.map(v => ({
                ...v,
                columns: _.times(verticalSections.length, () => ({type: "auto"})).concat(v.columns[v.columns.length-1]),
                rows: _.times(sections.length, () => ({type: "auto"}))
            }))
        }
        ds.components.responsiveLayout.update(page, newPageLayout)

        // Horizontal
        sections.forEach((s, i) => {
            const oldSectionLayout = _.cloneDeep(ds.components.responsiveLayout.get(s))
            oldSectionLayout.itemLayouts = oldSectionLayout.itemLayouts.map(item => ({
                ...item,
                gridArea: {
                    // ...item.gridArea,
                    columnStart: verticalSections.length + 1,
                    columnEnd: verticalSections.length + 2,
                    rowStart: i + 1,
                    rowEnd: i + 2
                }
            }))
            ds.components.responsiveLayout.update(s, oldSectionLayout)
        })
        // Vertical
        verticalSections.forEach((s, i) => {
            const oldSectionLayout = _.cloneDeep(ds.components.responsiveLayout.get(s))
            oldSectionLayout.itemLayouts = oldSectionLayout.itemLayouts.map(item => ({
                ...item,
                gridArea: {
                    // ...item.gridArea,
                    columnStart: i + 1,
                    columnEnd: i + 2,
                    rowEnd: sections.length + 1,
                    rowStart: 1
                }
            }))
            ds.components.responsiveLayout.update(s, oldSectionLayout)
        })
    })
})()