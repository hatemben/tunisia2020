// JSON DATA
var tunisia2020 = {};

//return an array of objects according to key, value, or key and value matching
function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else
        //if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
        if (i == key && obj[i] == val || i == key && val == '') { //
            objects.push(obj);
        } else if (obj[i] == val && key == '') {
            //only add if the object is not already in the array
            if (objects.lastIndexOf(obj) == -1) {
                objects.push(obj);
            }
        }
    }
    return objects;
}

// finds value in json object
function getKeys(obj, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getKeys(obj[i], val));
        } else if (obj[i] == val) {
            objects.push(obj);
        }
    }
    return objects;
}

// Count projects in a region
function countProjects(code) {
    keys = getKeys(tunisia2020, code);
    return keys.length
}

// Return list of projects by region
function listProjects(code, obj) {
    var liste = "<thead><tr><th>Titre</th><th>Responsable</th><th>Cost M€</th><th>Cost MDT</th><th># region</th><th>Lien</th></tr> </thead><tbody>";
    $.each(obj, function () {
        gov = this["governorate"];
        try {
            count = (gov.match(/,/g) || []).length + 1;
        } catch (err) {
            count = 0
        }
        liste += "<tr><td><a href=\"#\" onclick=\"projectDetail(" + this["ID"] + ")\">" + this["title"] + "</a></td><td>" + this["responsible"] + "</td><td>" + this["Cost M€"] + "</td><td>" + this["Cost MDT"] + "</td><td>" + count + "</td><td> <a href=\"" + this["link"] + "\" target=_blank>link</a></td></tr>"
    });
    liste += "</tbody>";
    return liste
}

function projectDetail(id) {

    var proj = getObjects(tunisia2020, 'ID', id);
    proj = proj[0];

    document.getElementById("projectdetail").innerHTML = "Titre : <strong>" + proj["title"] + "</strong> (<a onclick=\"deselect($('#projectdetail'));$('#mask').remove(); \" href=\"#\">Fermer</a>)<br/>" +
        "Responsable : <strong>" + proj["responsible"] + "</strong><br/>" +
        "Cout : <strong>" + proj["Cost M€"] + " M€ / " + proj["Cost MDT"] + " MDT</strong><br/>" +
        "Activité : <strong>" + proj["activity"] + "</strong><br/>" +
        "Secteur : <strong>" + proj["sector"] + "</strong><br/>" +
        "Gouvernorat(s) : <strong>" + proj["governorate"] + "</strong><br/>" +
        "<p><strong>Context :</strong> " + proj["context"] + "</p>" +
        "<p><strong>Detail :</strong> " + proj["detail"] + "</p>" +
        "<p><strong>Impact :</strong> " + proj["impact"] + "</p>" +
        "<p><strong>Montage financier :</strong> " + proj["financialarrangment"] + "</p>" +
        "<a onclick=\"deselect($('#projectdetail'));$('#mask').remove(); \" href=\"#\">Fermer</a>";

    if ($(this).hasClass('selected')) {
        deselect($(this));
        $('#mask').remove();
    } else {
        $(this).addClass('selected');
        $('.pop').slideFadeToggle();
        $('body').append('<div id="mask"></div>');
        $('#mask').fadeIn(300);
    }
}

function deselect(e) {
    $('.pop').slideFadeToggle(function () {
        e.removeClass('selected');
    });
}

$.fn.slideFadeToggle = function (easing, callback) {
    return this.animate({opacity: 'toggle', height: 'toggle'}, 'fast', easing, callback);
};


$(document).ready(function () {

    $('.close').on('click', function () {
        deselect($('#projectdetail'));
        $('#mask').remove();
        return false;
    });

    $.get('./tn2020-projects-fr.json', function (jsonData) {
        tunisia2020 = jsonData;

        $('#vmap').vectorMap({
            map: 'tunisia',
            selectedColor: '#567E2B',
            onLabelShow: function (event, label, code) {
                projects = countProjects(code);
                label.append(': (' + projects + ' projets)');
            },
            onRegionClick: function (element, code, region) {
                keys = getKeys(tunisia2020, code);
                res = "<h3>Region : " + region + " (" + keys.length + " projets )</h3>" +
                    "Liste des projets qui concerne la region de " + region + ":<br/> <table id=\"" + code + "\">" + listProjects(code, keys) + "</tab>";
                document.getElementById("projects").innerHTML = res;
                $('#' + code).DataTable();
                //
            }
        });

        // sector & industry bar chart
        createBarCharts(tunisia2020);
    });
});


function createBarCharts(rawData) {
    var labelsSector = ["Private", "Public", "Private-Public-Partnership"],
        valuesSector = [0, 0, 0];

    var labelsIndustry = [],
        valuesIndustry = [];

    //console.debug(rawData);

    //Structure data for barcharts
    rawData.forEach(function (entry) {
        if (entry.sector === "Public") {
            valuesSector[0] += parseInt(entry['Cost MDT']);
        } else if (entry.sector === "Privé") {
            valuesSector[1] += parseInt(entry['Cost MDT']);
        } else if ((entry.sector === "Public-privé" || entry.sector === "  Privé, Public-privé") || entry.sector === "Public-privé") {
            valuesSector[2] += parseInt(entry['Cost MDT'])
        }

        // industry
        if (labelsIndustry.indexOf(entry.activity) === -1) {
            labelsIndustry.push(entry.activity);
            valuesIndustry.push(parseInt(entry['Cost MDT']));
        } else {
            valuesIndustry[labelsIndustry.indexOf(entry.activity)] += parseInt(entry['Cost MDT']);
        }
    });


    new Chart(document.getElementById("sectorBarChart"), {
        type: 'bar',
        data: {
            labels: labelsSector,
            datasets: [
                {
                    label: "Investissements par secteur (en MDT)",
                    borderWidth: 1,
                    data: valuesSector
                }
            ]
        }
    });

    ///
    new Chart(document.getElementById("industryBarChart"), {
        type: 'bar',
        data: {
            labels: labelsIndustry,
            datasets: [
                {
                    label: "Investissement par secteur d'activité (en MDT)",
                    borderWidth: 1,
                    data: valuesIndustry
                }
            ]
        }
    });

}