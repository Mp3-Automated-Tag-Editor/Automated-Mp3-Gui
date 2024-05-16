
export function CheckItem({ lineType, message, messageOptional, result }: { lineType: number, message: string, messageOptional: string, result: boolean }) {
    return (
        <div>
            <p className={"line" + lineType}>{lineType == 3 ? <span>[&gt;]</span> : null} {message} <span style={result ? { color: 'rgb(205, 238, 105)' } : { color: 'rgb(222, 75, 75)' }}>{messageOptional}</span></p>
        </div>
    );
}

export function TerminalItem({ id, status, path, statusCode, errorMessage = "", percentage = 0 }: { id: number, status: any, path: string, statusCode: number, errorMessage: string, percentage: number }) {    
    console.log(status)
    switch (status) {
        case "SUCCESS": return (
            <div>
                <p className="line5">[&gt;] Song #{id} <span style={{ color: 'rgb(251, 146, 60)' }}>@{path}</span></p>
                <p className="line5 flex flex-row">Status: <span style={{ color: 'rgb(22, 163, 74)' }}>Done</span> with status Code: <span style={{ color: 'rgb(22, 163, 74)' }}>{statusCode}</span></p>
                <p className="line5">Percentage Accuracy: <span style={
                    {
                        color: percentage >= 70 ? 'rgb(22, 163, 74)' :
                            percentage >= 50 && percentage < 70 ? 'yellow' :
                                percentage >= 30 && percentage < 50 ? 'orange' :
                                    percentage < 30 ? 'red' : '#fff'
                    }
                }>{percentage}%</span></p>
            </div>
        );
        case "PROCESSING": return (
            <div>
                <p className="line5">[&gt;] Song #{id} <span style={{ color: 'rgb(251, 146, 60)' }}>@{path}</span></p>
                <p className="line5 flex flex-row">Status: <span className="flex flex-row px-2">Processing<div className="loader2"></div></span></p>
            </div>
        );
        case "FAILED": return (
            <div>
                <p className="line5">[&gt;] Song #{id} <span style={{ color: 'rgb(251, 146, 60)' }}>@{path}</span></p>
                <p className="line5 flex flex-row">Status: <span style={{ color: 'rgb(217, 17, 17)' }}>FAILED</span> with status Code: <span style={{ color: 'rgb(217, 17, 17)' }}>{statusCode}</span></p>
                {/* <p className="line5 flex flex-row">Error Message: <span style={{ color: 'rgb(217, 17, 170)' }}>{errorMessage}</span></p> */}
                <p className="line5"><span style={{ color: 'rgb(251, 146, 60)' }}>Error: </span> {errorMessage} </p>
            </div>
        );
    }
}