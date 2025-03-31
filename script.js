let currentUrl = window.location.href;
let urlWithoutDomain = currentUrl.replace(window.location.origin, '');

let urlParams = new URLSearchParams(urlWithoutDomain);

let currentWeek = parseInt(urlParams.get('selectedWeek'));
let currentGroup = "";

if (isNaN(currentWeek))
    currentWeek = 31;

getAPI();

function getAPI()
{
    let urlAPI = '/api' + urlWithoutDomain;
    fetch(urlAPI)
    .then(response => response.json())
    .then(data => {
        if (data.crrentWeek === 1)
        {
            const btn = document.querySelector("#previousWeek").style.vibisility = 'hidden';
        }
        else
        {
            const btn = document.querySelector("#previousWeek").style.vibisility = 'visible';
        }
        loadSchedule(data);
    })
    .catch(err => console.log(err))
}


function loadSchedule(data)
{
    currentWeek = parseInt(data.currentWeek);
    currentGroup = data.currentGroup;

    let label = document.getElementById('currentWeek');
    let currentGroupLable = document.getElementById('currentGroup');
    currentGroupLable.innerHTML = currentGroup;
    label.innerHTML = "Неделя " + currentWeek;
    let table = document.querySelector("#schedule");
    for (let child of table.childNodes) {
        table.removeChild(child);
    }
    let firstRow = table.insertRow();
    let textNode = document.createTextNode("Время");
    let cell = firstRow.insertCell();
    cell.style.width ="70px";
    cell.appendChild(textNode);
    firstRow.style.height = "70px";
    for (let date of data.dates) {
        let parts = date.split(" ");
        let cell = firstRow.insertCell();
        cell.style.width ="220px";
        cell.appendChild(document.createTextNode(parts[0]));
        cell.appendChild(document.createElement("br"));
        cell.appendChild(document.createTextNode(parts[1]));
    }

    for (let i=0; i < data.Times.length; i++)
    {
        let row = table.insertRow();
        row.style.maxHeight="60px"; 
        row.insertCell().appendChild(document.createTextNode(data.Times[i]));
        for (let j=0; j<data.dates.length; j++)
        {
            if (data.dayOfSchedule[6*i+j].subject == null)
                row.insertCell().appendChild(document.createTextNode(""));
            else
            {
                let cell = row.insertCell();
                let inforDay = data.dayOfSchedule[6*i+j];
                let inforSubject = document.createElement("h4");
                inforSubject.textContent = inforDay.subject;
                inforSubject.style.color = data.color[6*i+j];

                cell.appendChild(inforSubject);
                cell.appendChild(document.createTextNode(inforDay.place));
                cell.appendChild(document.createElement("br"));
                for (let group of inforDay.groups)
                {
                    let groupInfor = document.createElement('a');
                    groupInfor.textContent = JSON.parse(group).name;
                    groupInfor.href = JSON.parse(group).link;
                    cell.appendChild(groupInfor);
                    cell.appendChild(document.createElement("br"));
                }
                if (inforDay.teacher != null)
                {
                    let teacherInJson = JSON.parse(inforDay.teacher);
                    let inforTeacher = document.createElement('a');
                    inforTeacher.textContent = teacherInJson.name;
                    inforTeacher.href = teacherInJson.link;
                    cell.appendChild(inforTeacher);
                    cell.appendChild(document.createElement("br"));
                }
                cell.appendChild(document.createElement("br"));
            }
        }   
    }
}

function previousWeek()
{
    if (currentWeek <=21)
        return;
    currentWeek = currentWeek-1;
    let query = urlWithoutDomain.split('?')[1];
    let urlParams = new URLSearchParams(query);
    urlParams.set('selectedWeek', currentWeek);
    urlWithoutDomain = '/rasp?' + urlParams.toString();
    location.assign(urlWithoutDomain);
}

function nextWeek()
{
    if (currentWeek >=41)
        return;
    currentWeek = currentWeek+1;
    let query = urlWithoutDomain.split('?')[1];
    let urlParams = new URLSearchParams(query);
    urlParams.set('selectedWeek', currentWeek);
    urlWithoutDomain = '/rasp?' + urlParams.toString();
    location.assign(urlWithoutDomain);
}

function loadNewUrl()
{
    getAPI();
    location.assign(urlWithoutDomain);
}

fetch('/getGroupsAndTeachers')
    .then(response => response.json())
    .then(data => {
        let groups = document.getElementById("selectGroups");
        
        for (let group of data.groups)
        {
            let groupInOption = document.createElement('option');
            groupInOption.setAttribute('value', group.name);
            groups.appendChild(groupInOption);
        }

        for (let teacher of data.teachers)
        {
            let teacherInOptions = document.createElement('option');
            teacherInOptions.setAttribute('value', teacher.name);
            groups.appendChild(teacherInOptions);
        }

        let input = document.getElementById('inputTextGroup');

        input.addEventListener('change', (event) => {
            for (let group of data.groups)
            {
                if (group.name.trim() == input.value.trim())
                {
                    urlWithoutDomain = group.link;
                    loadNewUrl();
                    break;
                }
            }
            for (let teacher of data.teachers)
            {
                if (teacher.name.trim() == input.value.trim())
                {
                    urlWithoutDomain = teacher.link;
                    loadNewUrl();
                    break;
                }
            }
        });
    });

