export function SongItem({ path, status, percentage, id }: { path: string, status: boolean, percentage: number, id: number }) {
    return (
        <div>
            <p className="line5">[&gt;] Song #{id} <span style={{ color: 'rgb(251, 146, 60)' }}>@{path}</span></p>
            <p className="line5 flex flex-row">Status: {status ?
                <span className="flex flex-row px-2">
                    Processing<div className="loader2"></div>
                </span>
                : <span style={{ color: 'rgb(22, 163, 74)' }}>Done</span>}</p>
            {!status ? <p className="line5">Percentage Accuracy: <span style={
                {
                    color: percentage >= 70 ? 'rgb(22, 163, 74)' :
                        percentage >= 50 && percentage < 70 ? 'yellow' :
                            percentage >= 30 && percentage < 50 ? 'orange' :
                                percentage < 30 ? 'red' : '#fff'
                }
            }>{percentage}%</span></p>
                : null}
        </div>
    );
}

export function ErrorItem({ code, message }: { code: number, message: string }) {
    return (
        <div>
            <p className="line5">[&gt;] <span style={{ color: 'rgb(251, 146, 60)' }}>Error: </span> {message} with code {code}</p>
        </div>
    );
}

export function CheckItem({ lineType, message, messageOptional, result }: { lineType: number, message: string, messageOptional:string, result: boolean }) {
    return (
        <div>
            <p className={"line"+lineType}>{lineType == 3 ? <span>[&gt;]</span> : null} {message} <span style={result ? { color: 'rgb(205, 238, 105)' } : { color: 'rgb(222, 75, 75)' }}>{messageOptional}</span></p>
        </div>
    );
}

{/* 
<p className="line2">Welcome to the Automated Mp3 Tag Editor. Initializing Scraper</p>
<p className="line3">[&gt;] Chosen Directory: {directory}</p>
<p className="line3">[&gt;] Number of Threads: {settingsData.threads}</p>
<p className="line3">[&gt;] Checking Network: </p>
<p className="line3">[&gt;] Network Speed: </p>
<p className="line3">[&gt;] Network Latency: </p>
<p className="line3">[&gt;] Server Health: {serverHealth?.message}</p>
<p className="line2">Initialization Complete, Listening for events...</p>
*/}