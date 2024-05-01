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