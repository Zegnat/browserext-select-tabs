export function sameSite({ url }) {
    const host = (new URL(url)).hostname;
    return queryTabs({ url: host ? `*://${host}/*` : url });
}

export async function sameSite__descendants(tab) {
    const tabs = await sameSite(tab);
	const descendantTabs = (await Promise.all( tabs.map(getDescendants) )).flat();
	return tabs.concat(descendantTabs);
}

export async function sameSite__cluster(tab) {
    const tabs = await sameSite(tab);
    const tabIndex = tab.index;
    const arrayIndex = tabs.findIndex(tab => tab.index === tabIndex);
    const difference = tabIndex - arrayIndex;
    return tabs.filter((tab, i) => i + difference === tab.index); // Cluster tabs share the same difference between tab and tabs-array indexes
}

export async function left({ index }) {
    return (await queryTabs()).slice(0, index + 1);
}

export async function right({ index }) {
    return (await queryTabs()).slice(index);
}

export async function parent({ openerTabId }) {
    if (openerTabId) return [await getTab(openerTabId)];
}

export async function parent__descendants(tab) {
    const { openerTabId } = tab;
    return openerTabId ? (await Promise.all([ getTab(openerTabId), getDescendants(openerTabId) ])).flat()
        : descendants(tab);
}

export async function siblings({ openerTabId }) {
    return openerTabId ? getChildren(openerTabId) // If target tab has parent, get all tabs with same parent
        : (await queryTabs()).filter(tab => !tab.openerTabId); // Else, get all parentless tabs
}

export function siblings__descendants({ openerTabId }) {
    return getDescendants(openerTabId);
}

export async function descendants(tab) {
    return [tab, ...await getDescendants(tab)];
}

async function getDescendants(tab_or_tabId) {
    const tabId = tab_or_tabId?.id || tab_or_tabId;
	const childTabs = await getChildren(tabId);
    const descendantTabs = (await Promise.all( childTabs.map(getDescendants) )).flat();
	return childTabs.concat(descendantTabs);
}

const getTab = id => browser.tabs.get(id);
const queryTabs = critieria => browser.tabs.query({ ...critieria, currentWindow: true });
const getChildren = openerTabId => queryTabs({ openerTabId });