let Port = process.env.PORT || 3456;
let XMLHttpRequest = require('xhr2');
let http = require('http');
let path = require('path');
let express = require('express');
let app = express();
let server = http.Server(app);
let HTMLParser = require('node-html-parser');
let fs = require('fs');

app.use(express.static(__dirname));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(Port, () => {
    console.log('Server listening on port 3456 ... http://localhost:3456');
});

app.get('/rasp', (req, res) => {
   res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/rasp', (req, res) => {
    console.log("api:" + req.url.replace('/api', ''));
    let url = "https://ssau.ru"+ req.url.replace('/api', '');
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.send(null);
    request.onreadystatechange = () =>
    {
        if (request.readyState == 4)
        {
            let data = HTMLParser.parse(request.responseText);
            res.send(analisData(data));
        }
    }
});

function analisData(data)
{
    let schedule = {
        dates: [],
        dayOfSchedule: [],
        Times: [],
        currentWeek: 31,
        color: [],
        currentGroup: ""
    };
    if (data.querySelector(".week-nav-current_week") != null)
        schedule.currentWeek = parseInt(data.querySelector(".week-nav-current_week").innerText);
    if (data.querySelector(".info-block__title") != null)
        schedule.currentGroup = data.querySelector(".info-block__title").innerText;
    console.log(schedule.currentWeek);
    for (let cell of data.querySelectorAll(".schedule__time"))
        schedule.Times.push(cell.innerText);
    for (let cell of data.querySelectorAll(".schedule__item"))
    {
        if (cell.querySelector(".schedule__head-weekday"))
            schedule.dates.push(cell.innerText.trim());
        else 
        {
            if (cell.querySelector(".schedule__lesson"))
            {
                let subject = cell.querySelector(".schedule__discipline").innerText.trim();
                if (cell.querySelector(".lesson-type-1__color"))
                    schedule.color.push("#a8f2a8");
                else if (cell.querySelector(".lesson-type-2__color"))
                    schedule.color.push("#9009df");
                else if (cell.querySelector(".lesson-type-3__color"))
                    schedule.color.push("#2008f1");
                else if (cell.querySelector(".lesson-type-4__color"))
                    schedule.color.push("#f4c7a8");
                let teacherElement = cell.querySelector(".schedule__teacher > .caption-text");
                let teacher;
                let place = cell.querySelector(".schedule__place").innerText.trim();
                if (teacherElement!= null)
                {
                    teacher = JSON.stringify({"name": teacherElement.innerText.trim(), "link": teacherElement.getAttribute("href")});
                }
                else
                    teacher = null;
                let groupsElement = cell.querySelectorAll(".schedule__group");
                let groups = [];
                if (groupsElement!= null)
                    for (let group of groupsElement)
                    {
                        groupLink = group.getAttribute("href");
                        groupName = group.innerText.trim();
                        groups.push(JSON.stringify({
                            "name": groupName,
                            "link": groupLink
                        }));
                    }
                schedule.dayOfSchedule.push({
                    "subject": subject,
                    "place": place,
                    "teacher": teacher,
                    "groups": groups});
            }
            else
            {
                schedule.dayOfSchedule.push({"subject" : null});
                schedule.color.push(null);
            }
        }
    }
    schedule.dayOfSchedule = schedule.dayOfSchedule.slice(1, schedule.dayOfSchedule.length);
    schedule.color = schedule.color.slice(1, schedule.color.length);
    return JSON.stringify(schedule);
}


app.get('/getGroupsAndTeachers', (req, res) => {
    //getGroupsAndTeachers();
    res.sendFile(path.join(__dirname, 'ListGroupsTeachers.json'));
});

function getGroupsAndTeachers() {
    {
        let result = { groups: [], teachers: [] };
        let count = 0;
        let allHTMLResponses = [];
        for (let i = 1; i < 6; i++) {
            let request = new XMLHttpRequest();
            let url = "https://ssau.ru/rasp/faculty/492430598?course=" + i;
            request.open("GET", url, true);
            request.send(null);
            request.onreadystatechange = () => {
                if (request.readyState == 4) {
                    let root = HTMLParser.parse(request.responseText);
                    let groups = root.querySelectorAll(".group-catalog__groups > a");
                    for (let group of groups) {
                        const id = group.getAttribute("href").replace(/\D/g, '');
                        result.groups.push({ name: group.innerText, link: `/rasp?groupId=${id}` })
                    }
                }
            };
        }
        for (let i = 1; i < 120; i++) {
            let request = new XMLHttpRequest();
            let url = "https://ssau.ru/staff?page=" + i;
            request.open("GET", url, true);
            request.send(null);
            request.onreadystatechange = () => {
                if (request.readyState == 4) {
                    count++;
                    allHTMLResponses.push(request.responseText);
                    if (count === 115) {
                        for (let teacher of allHTMLResponses) {
                            let root = HTMLParser.parse(teacher);
                            let teachers = root.querySelectorAll(".list-group-item > a");
                            for (let teacher of teachers) {
                                const id = teacher.getAttribute("href").replace(/\D/g, '');
                                result.teachers.push({ name: teacher.innerText, link: `/rasp?staffId=${id}` })
                            }
                        }
                        fs.writeFileSync("ListGroupsTeachers.json", JSON.stringify(result));
                    }
                }
            };
        }
    }
}