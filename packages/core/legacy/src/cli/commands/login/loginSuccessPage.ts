export function loginSuccessPage() {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Arco CLI login succeeded</title>
  </head>
  <body style="background-color: #1d2129">
    <div
      style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 40px 60px;
        font-size: 16px;
        border-radius: 30px;
        background-color: #165dff;
        color: #fff;
      "
    >
      <span
        style="
          position: absolute;
          display: block;
          width: 4px;
          height: 62%;
          left: 40px;
          top: 19%;
          background-color: rgba(255, 255, 255, 0.8);
        "
      ></span>
      <p style="font-size: 32px; font-weight: 500; margin-top: 12px">Arco CLI Login Succeeded</p>
      <p>You can close this page now</p>
      <p>
        Enter
        <code
          style="
            background-color: rgba(255, 255, 255, 0.2);
            margin: 0 6px;
            padding: 3px 8px;
            border-radius: 4px;
          "
          >arco -h</code
        >
        on the command line to view the help information
      </p>
    </div>
  </body>
</html>
`;
}
