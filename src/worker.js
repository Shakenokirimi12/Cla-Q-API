// src/worker.js
var worker_default = {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method == "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://app.cla-q.net",
          "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    } else if (pathname === "/class_info/pdf") {
      try {
        const data = await request.json();
        var class_Code = data.class_Code;
        if (checkValidate(class_Code)) {
          console.error("required value is not specified.");
          return new Response(JSON.stringify([{ "message": "Required value is not specified.:", "status_Code": "NE-11", "result": "error" }]), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type"
            }
          });
        }
      } catch (error) {
        console.error("required value is not specified.");
        return new Response(JSON.stringify([{ "message": "Required value is not specified.:", "status_Code": "NE-11", "result": "error" }]), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://app.cla-q.net",
            "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
      try {
        const { results: pdfFiles } = await env.D1_DATABASE.prepare(
          //PDFファイルの一覧を取得
          "SELECT * FROM pdf_Files WHERE class_Code = ?"
        ).bind(class_Code).all();
        pdfFiles.push({ "message": "PDF File list succesfully fetched.", "status_Code": "CPE-01", "result": "success", "pdf": "true" });
        console.log("return pdfList.", pdfFiles);
        return new Response(JSON.stringify(pdfFiles), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://app.cla-q.net",
            "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      } catch (error) {
        console.log(error);
        return new Response(JSON.stringify([{ "message": "Internal server error.", "status_Code": "CPE-01", "result": "error" }]), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://app.cla-q.net",
            "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
    } else if (pathname === "/detect_role") {
      try {
        const data = await request.json();
        var userName = data.userName;
        var userEmail = data.userEmail;
        if (checkValidate(userName) || checkValidate(userEmail)) {
          console.error("required value is not specified.");
          return new Response(JSON.stringify([{ "message": "Required value is not specified.:", "status_Code": "NE-11", "result": "error" }]), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type"
            }
          });
        }
      } catch (error) {
        console.error("required value is not specified.");
        return new Response(JSON.stringify([{ "message": "Required value is not specified.:", "status_Code": "NE-11", "result": "error" }]), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
      try {
        const { results: specifiedTeachers } = await env.D1_DATABASE.prepare(
          //生徒の答え一覧を取得
          "SELECT * FROM TeachersList WHERE user_Email = ? AND 	user_Name = ?"
        ).bind(userEmail, userName).all();
        if (specifiedTeachers.length == 1) {
          var result = [{
            "message": "user is teacher.",
            "status_Code": "DR-01",
            "result": "success"
          }];
        } else {
          var result = [{
            "message": "user is student.",
            "status_Code": "DR-02",
            "result": "success"
          }];
        }
        console.log(result);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      } catch (error) {
        console.log(error);
        return new Response(JSON.stringify([{ "message": "Internal server error." + error, "status_Code": "DRE-01", "result": "error" }]), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
    } else if (pathname === "/teapot") {
      return new Response("How do you know this API pathname? 418 I'm a teapot.", {
        status: 418,
        headers: {
          "Content-Type": "text/plain",
          "Vary": "Origin",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    } else if (pathname === "/status") {
      await env.D1_DATABASE.prepare(
        //Uptime用のテストクラスの接続済みリストからUptime削除
        "DELETE FROM ConnectedUsers WHERE connected_User_Name = ?"
      ).bind("Uptime").run();
      await env.D1_DATABASE.prepare(
        //Uptime用のテストクラスの答えのリストからUptimeの解答を削除
        "DELETE FROM Answers WHERE submitted_User_Name = ?"
      ).bind("Uptime").run();
      await env.D1_DATABASE.prepare(
        //Uptime用のテストクラスからUptimeのクラスを削除
        "DELETE FROM Classes WHERE 	created_Teacher_Name = ?"
      ).bind("Uptime").run();
      await env.D1_DATABASE.prepare(
        //Uptime用のテストクラスの生徒数を0に変更
        "UPDATE Classes SET students = 0 WHERE class_Code = ?"
      ).bind("10000").run();
      await env.D1_DATABASE.prepare(
        //接続済みリストからUptime削除
        "UPDATE Classes SET current_Question_Number = 1, latest_Question_Number = 1 WHERE class_Code = 10000"
      ).run();
      return new Response("API is working.", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Vary": "Origin",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    } else {
      console.info("API pathname is not described or wrong.");
      return new Response(JSON.stringify([{ "message": "API pathname is not described or wrong.", "status_Code": "NE-12", "result": "error" }]), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://app.cla-q.net",
          "Vary": "Origin",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
  }
};
function checkValidate(value) {
  if (value == void 0 || value == "" || value == null) {
    return true;
  } else {
    return false;
  }
}
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
