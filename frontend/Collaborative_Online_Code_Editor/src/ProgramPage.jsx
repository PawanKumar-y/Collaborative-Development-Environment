import './ProgramPage.css'
import Editor from "@monaco-editor/react";
import { useState } from 'react';
function ProgramPage()
{
    const [language,setLanguage]=useState("cpp");
    const [code,setCode]=useState("Start typing your code here")
    const executeProgram=()=>{
        alert("The program will be executed in "+language+" language. This feature is under development. Please check back later.");
    }
    return(
        <div className="codeExecutionPage">
            <div className="pageHeader">
                <div>
                    <h2>C.O.D.E's online compiler </h2>
                    <p>Write and preview code in a friendly editor with instant syntax support.</p>
                </div>
            </div>
            <div className="CodeExecutionPage">
                <section className="ProgramSide">
                    <div className="panelHeader">
                        <div>
                            <h3>Editor</h3>
                            <p>Select your language and start typing.</p>
                        </div>
                        <div className="toolbar">
                            <label htmlFor="language-dropdown">Language</label>
                            <select id="language-dropdown" value={language} onChange={(e)=>(setLanguage(e.target.value))}>
                                <option value="cpp">C++</option>
                                <option value="python">Python</option>
                                <option value="c">C</option>
                                <option value="java">Java</option>
                            </select>
                            <button className="execute" onClick={()=>(executeProgram())}>Run Program</button>
                        </div>
                    </div>
                    <div className="editorWrapper">
                        <Editor 
                            className="Editor"
                            height="100%"
                            defaultLanguage={language}
                            value={code}
                            onChange={(val)=>(setCode(val))}
                            theme="vs-dark"
                        />
                    </div>
                </section>
                <aside className="OutputSide">
                    <div className="panelHeader outputHeader">
                        <div>
                            <h3>Console Output</h3>
                            <p>See compilation results or printed output here.</p>
                        </div>
                    </div>
                    <div className="outputContent">
                        <p>Run your code to display output here.</p>
                    </div>
                </aside>
            </div>
        </div>
    )
}
export default ProgramPage