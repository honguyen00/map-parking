let filterEl = document.getElementById('filter-Btn');
let searchOptionEl = document.querySelector('.search-option');
let saveEl = document.querySelector('.save-Btn');
let cancelEl = document.querySelector('.cancel-Btn');

filterEl.addEventListener("click", function() {
    searchOptionEl.classList.remove('hide');
});

cancelEl.addEventListener("click", function() {
    searchOptionEl.classList.add('hide');
});

saveEl.addEventListener("click", function() {
    let freeEl = document.querySelector('#free');
    let paidEl = document.querySelector('#paid');
    let accessibleEl = document.querySelector('#accessible');

    let fiveEl = document.querySelector('#five');
    let tenEl = document.querySelector('#ten');
    let fiftenEl = document.querySelector('#fiften');
    let twentyEl = document.querySelector('#twenty');

    if (freeEl.checked === true) {
        console.log(freeEl.value);
    };

    if (paidEl.checked === true) {
        console.log(paidEl.value);
    };

    if (accessibleEl.checked === true) {
        console.log(accessibleEl.value);
    };

    let radius;
    if (fiveEl.checked === true) {
        radius = fiveEl.value
    } else if(tenEl.checked === true) {
        radius = tenEl.value
    } else if (fiftenEl.checked === true) {
        radius = fiftenEl.value
    } else  {
        radius = twentyEl.value
    }
    console.log(radius);
});
