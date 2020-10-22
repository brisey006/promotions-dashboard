function compareNumbers(a, b) {
    return a - b;
}

export default (pagination) => {
    let totalPages = pagination.totalPages;
    const page = pagination.page;

    const displayedPages = [];

    for (let i = page-1; i > page - 3; i--) {
        displayedPages.push(i);
    }
    displayedPages.push(page);

    for (let i = page + 1; i < page + 3; i++) {
        displayedPages.push(i);
    }
    displayedPages.sort();
    const array = [];
    let max = displayedPages[displayedPages.length -1];

    displayedPages.forEach((i) => {
        if (i <= 0) {
            array.push(max + (i * -1) + 1);
        } else {
            array.push(i);
        }
    });
    
    array.sort(compareNumbers);
    
    const visiblePages = [];
    const min = array[0];
    max = array[array.length - 1];

    array.forEach((i) => {
        if (i > totalPages) {
            const n = min - (i - totalPages);
            if (n > 0) {
                visiblePages.push();
            }
        } else {
            visiblePages.push(i);
        }
    });

    visiblePages.sort(compareNumbers);
    return { ...pagination, visiblePages }
}